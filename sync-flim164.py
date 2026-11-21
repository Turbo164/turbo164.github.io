"""Refresh Turbo164's public FLIM164 diorama snapshot."""
import datetime
import json
import re
import time
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlencode, urljoin, urlsplit, urlunsplit
from urllib.request import Request, urlopen

ORIGIN = "https://www.flim164.com"
HOSTS = {"flim164.com", "www.flim164.com"}
CATEGORIES = {"diorama-164": "Diorama 1:64", "mini-diorama-164": "Mini Diorama 1:64"}
OUTPUT = Path(__file__).resolve().parents[1] / "diorama-catalog.json"


def checked_url(value, path_pattern):
    url = urlsplit(urljoin(ORIGIN, value))
    if url.scheme != "https" or url.netloc not in HOSTS or not re.fullmatch(path_pattern, url.path):
        raise ValueError(f"Unexpected FLIM164 URL: {value}")
    return urlunsplit(("https", "www.flim164.com", url.path, url.query, ""))


def fetch(url):
    request = Request(url, headers={"User-Agent": "Turbo164-FLIM164-Partner-Catalog/1.0", "Accept": "text/html"})
    with urlopen(request, timeout=20) as response:
        checked_url(response.geturl(), r"/products(?:/[a-z0-9-]+)?/?")
        if response.headers.get_content_type() != "text/html":
            raise ValueError(f"Unexpected catalog response: {url}")
        content = response.read(3_000_001)
        if len(content) > 3_000_000:
            raise ValueError(f"Catalog page exceeded size limit: {url}")
        time.sleep(.15)
        return content.decode(response.headers.get_content_charset() or "utf-8")


class CatalogPage(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.products = []
        self.image_link = None
        self.count = None
        self.read_count = False
        self.feed(html)

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        classes = attrs.get("class", "").split()
        if tag == "a" and "product-image" in classes:
            self.image_link = attrs["href"]
        elif tag == "img" and self.image_link:
            name = " ".join(attrs.get("alt", "").split())
            if name:
                self.products.append({
                    "name": name,
                    "url": checked_url(self.image_link, r"/products/[a-z0-9-]+"),
                    "image": checked_url(attrs["src"], r"/media/products/[A-Za-z0-9._/-]+"),
                })
            self.image_link = None
        if tag == "span" and "results-count" in classes:
            self.read_count = True

    def handle_endtag(self, tag):
        if tag == "a":
            self.image_link = None
        if tag == "span":
            self.read_count = False

    def handle_data(self, data):
        if self.read_count:
            match = re.search(r"([\d,]+)\s+products? found", data, re.I)
            if match:
                self.count = int(match[1].replace(",", ""))


class DetailPage(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.description = []
        self.read_description = False
        self.has_title = False
        self.feed(html)

    def handle_starttag(self, tag, attributes):
        classes = dict(attributes).get("class", "").split()
        if tag == "div" and "description-content" in classes:
            self.read_description = True
        if tag == "h1" and "product-title" in classes:
            self.has_title = True

    def handle_endtag(self, tag):
        if tag == "div":
            self.read_description = False

    def handle_data(self, data):
        if self.read_description:
            self.description.append(data)

    def dimensions(self):
        if not self.has_title:
            raise ValueError("Product detail page is missing its title")
        match = re.search(
            r"\b(\d+(?:\.\d+)?(?:\s*[x×]\s*\d+(?:\.\d+)?){1,2})\s*(cm|mm)\b",
            " ".join(self.description), re.I,
        )
        if not match:
            return None
        return " × ".join(re.split(r"\s*[x×]\s*", match[1], flags=re.I)) + " " + match[2].lower()


def list_category(category):
    products = {}
    expected = None
    for page in range(1, 51):
        params = {"category": category}
        if page > 1:
            params["page"] = page
        listing = CatalogPage(fetch(f"{ORIGIN}/products?{urlencode(params)}"))
        if listing.count is None or (expected is not None and listing.count != expected):
            raise ValueError(f"Unrecognized or changing result count for {category}")
        expected = listing.count
        before = len(products)
        products.update((item["url"], item) for item in listing.products)
        if len(products) == expected:
            return products.values()
        if len(products) == before or len(products) > expected:
            raise ValueError(f"Incomplete pagination for {category}: got {len(products)} of {expected}")
    raise ValueError(f"Pagination limit reached for {category}")


def sync():
    entries = {}
    for key, label in CATEGORIES.items():
        for item in list_category(key):
            if item["url"] not in entries:
                dimensions = DetailPage(fetch(item["url"])).dimensions()
                entries[item["url"]] = {**item, "category": label, "scale": "1:64", "dimensions": dimensions}
    if not entries:
        raise ValueError("Empty partner catalog; retaining previous snapshot")
    products = sorted(entries.values(), key=lambda item: (item["name"].casefold(), item["url"]))
    previous = json.loads(OUTPUT.read_text(encoding="utf-8")) if OUTPUT.exists() else {}
    if previous.get("products") == products:
        print(f"No catalog changes ({len(products)} products).")
        return
    data = {
        "source": f"{ORIGIN}/products",
        "updated": datetime.datetime.now(datetime.timezone.utc).date().isoformat(),
        "products": products,
    }
    temp = OUTPUT.with_suffix(".tmp")
    temp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temp.replace(OUTPUT)
    print(f"Saved {len(products)} products.")


if __name__ == "__main__":
    sync()

