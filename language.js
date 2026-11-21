/* Turbo164 UI translations. Catalogue names and user-entered content stay as entered. */
(() => {
  'use strict';
  const rows = [
    ['Website language','ภาษาเว็บไซต์','ウェブサイトの言語','网站语言'],
    ['Refresh catalogue and private garage','รีเฟรชแค็ตตาล็อกและโรงรถส่วนตัว','カタログとマイガレージを更新','刷新目录和个人车库'],
    ['Refresh','รีเฟรช','更新','刷新'],['↻ Refresh','↻ รีเฟรช','↻ 更新','↻ 刷新'],['↻ Refreshing…','↻ กำลังรีเฟรช…','↻ 更新中…','↻ 正在刷新…'],
    ['Log in','เข้าสู่ระบบ','ログイン','登录'],['👤 Log in','👤 เข้าสู่ระบบ','👤 ログイン','👤 登录'],['Log in / Sign up','เข้าสู่ระบบ / สมัครสมาชิก','ログイン / 新規登録','登录 / 注册'],['Log out','ออกจากระบบ','ログアウト','退出登录'],['Guest','ผู้เยี่ยมชม','ゲスト','访客'],['Guest · Log in','ผู้เยี่ยมชม · เข้าสู่ระบบ','ゲスト · ログイン','访客 · 登录'],['Guest · browsing only','ผู้เยี่ยมชม · ดูอย่างเดียว','ゲスト · 閲覧のみ','访客 · 仅浏览'],
    ['Your miniature garage.','โรงรถโมเดลจิ๋วของคุณ','あなたのミニチュアガレージ','您的迷你车库'],['Four diecast brands · One shared catalogue, your own saved garage','รถไดแคสต์ 4 แบรนด์ · แค็ตตาล็อกร่วมและโรงรถส่วนตัวของคุณ','4つのミニカーブランド · 共通カタログと自分専用ガレージ','四个合金车品牌 · 共享目录与您的个人车库'],
    ['Owned','มีแล้ว','已拥有','已拥有'],['Ordered','สั่งซื้อแล้ว','注文済み','已订购'],['Missing','ยังไม่มี','未拥有','缺少'],['Unconfirmed','ยังไม่ยืนยัน','未确认','未确认'],['Wishlist','สิ่งที่อยากได้','ほしい物リスト','愿望清单'],['＋ Choose status to save','＋ เลือกสถานะเพื่อบันทึก','＋ 保存する状態を選択','＋ 选择状态以保存'],['＋ Add to my private garage','＋ เพิ่มในโรงรถส่วนตัว','＋ マイガレージに追加','＋ 添加到个人车库'],
    ['Loading collection…','กำลังโหลดคอลเล็กชัน…','コレクションを読み込み中…','正在加载收藏…'],['Shared catalogue & my garage','แค็ตตาล็อกร่วมและโรงรถของฉัน','共有カタログとマイガレージ','共享目录与我的车库'],['Search diecast brand, model or product number…','ค้นหาแบรนด์ รุ่น หรือรหัสสินค้า…','ブランド、モデル、商品番号を検索…','搜索品牌、车型或产品编号…'],
    ['All','ทั้งหมด','すべて','全部'],['Chase','รุ่น Chase','チェイス','追逐版'],['Event','รุ่นพิเศษงานอีเวนต์','イベント限定','活动版'],['Limited','รุ่นลิมิเต็ด','限定版','限量版'],['Upcoming','เร็ว ๆ นี้','発売予定','即将推出'],['Regular','รุ่นปกติ','通常版','常规版'],['Event Exclusive','รุ่นพิเศษเฉพาะงาน','イベント限定品','活动限定'],['Limited Edition','รุ่นลิมิเต็ด','限定版','限量版'],['Unverified','ยังไม่ยืนยัน','未验证','未验证'],['Announced','ประกาศแล้ว','已公布','已公布'],['Preorder','เปิดจอง','予約受付中','预订中'],['TBA','รอประกาศ','未定','待定'],['Released','วางจำหน่ายแล้ว','発売済み','已发布'],['Discontinued','เลิกผลิต','生産終了','已停产'],
    ['Release submission','ส่งข้อมูลรุ่นใหม่','新製品の登録','提交新款'],['Community catalogue · Requires approval','แค็ตตาล็อกชุมชน · ต้องได้รับอนุมัติ','コミュニティカタログ · 承認が必要','社区目录 · 需要审核'],['Smart Camera fills this draft with the selected or scanned release details. Check the brand, product code and evidence before sending it for administrator review. Approved releases become available to all collectors.','Smart Camera จะกรอกรายละเอียดรุ่นที่เลือกหรือสแกน ตรวจสอบแบรนด์ รหัสสินค้า และหลักฐานก่อนส่งให้ผู้ดูแลตรวจสอบ รุ่นที่อนุมัติแล้วจะเผยแพร่ให้ทุกคน','Smart Cameraが選択またはスキャンした製品情報を入力します。ブランド、商品コード、証拠を確認して管理者に送信してください。承認された製品は全コレクターに公開されます。','智能相机将填入所选或扫描到的款式信息。发送给管理员审核前，请核对品牌、商品编号和证据。获批款式会对所有收藏者开放。'],
    ['Diecast brand *','แบรนด์รถไดแคสต์ *','ミニカーブランド *','合金车品牌 *'],['Vehicle manufacturer *','ผู้ผลิตรถยนต์ *','自動車メーカー *','汽车制造商 *'],['Full model name / livery *','ชื่อรุ่น / ลวดลายเต็ม *','モデル名 / カラーリング *','完整车型名称 / 涂装 *'],['Product or catalogue code','รหัสสินค้าหรือแค็ตตาล็อก','商品コードまたはカタログ番号','商品或目录编号'],['Official SKU if known','SKU ทางการ (ถ้าทราบ)','公式SKU（分かる場合）','官方SKU（如已知）'],['Release year (optional)','ปีที่วางจำหน่าย (ไม่บังคับ)','発売年（任意）','发布年份（可选）'],['Edition','รุ่นย่อย','エディション','版本'],['Release status','สถานะการวางจำหน่าย','発売状況','发布状态'],['Product / announcement source (optional)','แหล่งข้อมูลสินค้า / ประกาศ (ไม่บังคับ)','製品 / 発表元のリンク（任意）','产品 / 公告来源（可选）'],['Notes for the administrator','หมายเหตุถึงผู้ดูแล','管理者へのメモ','给管理员的备注'],['What makes this release different? Include event, colour, package, and source details.','รุ่นนี้แตกต่างอย่างไร? ระบุอีเวนต์ สี แพ็กเกจ และแหล่งข้อมูล','この製品の特徴を入力してください。イベント、色、パッケージ、情報元など。','此款产品有何不同？请填写活动、颜色、包装和来源信息。'],['e.g. Porsche / Nissan','เช่น Porsche / Nissan','例: Porsche / Nissan','例如 Porsche / Nissan'],['e.g. Porsche 911 GT3 R Beijing #321','เช่น Porsche 911 GT3 R Beijing #321','例: Porsche 911 GT3 R Beijing #321','例如 Porsche 911 GT3 R Beijing #321'],['e.g. 2026','เช่น 2026','例: 2026','例如 2026'],['https://manufacturer.example/model','https://manufacturer.example/model','https://manufacturer.example/model','https://manufacturer.example/model'],
    ['Optional photos (up to 3). Photograph the exact model, box and product code when possible.','แนบรูปได้สูงสุด 3 รูป หากทำได้ให้ถ่ายรุ่น กล่อง และรหัสสินค้าให้ชัดเจน','写真は最大3枚まで。可能であればモデル、箱、商品コードを撮影してください。','可选照片（最多3张）。请尽量拍摄确切车型、包装盒和商品编号。'],['📷 Take photo','📷 ถ่ายรูป','📷 写真を撮る','📷 拍照'],['Choose photos','เลือกรูปภาพ','写真を選択','选择照片'],['Choose image','เลือกรูปภาพ','画像を選択','选择图片'],['If I upload images, I confirm I took them or have permission to publish them in the shared catalogue.','หากอัปโหลดรูป ฉันยืนยันว่าเป็นผู้ถ่ายหรือได้รับอนุญาตให้นำไปเผยแพร่ในแค็ตตาล็อกร่วม','画像をアップロードする場合、自分で撮影したか共有カタログへの掲載許可を得ていることを確認します。','如果我上传图片，即表示我确认图片由我拍摄或已获准发布到共享目录。'],['Submit release for review','ส่งรุ่นให้ตรวจสอบ','製品情報を審査に送信','提交款式以供审核'],['My model submissions','รายการรุ่นที่ฉันส่ง','自分の製品申請','我提交的款式'],['Sign in to view your proposals.','เข้าสู่ระบบเพื่อดูรายการที่ส่ง','申請を表示するにはログインしてください。','登录以查看您提交的款式。'],['Model review — Admin only','ตรวจสอบรุ่น — เฉพาะผู้ดูแล','製品審査 — 管理者専用','款式审核 — 仅管理员'],['↻ Refresh queue','↻ รีเฟรชคิว','↻ 審査待ちを更新','↻ 刷新队列'],['Photos submitted by collectors are reviewed before publication.','รูปภาพที่นักสะสมส่งมาจะได้รับการตรวจสอบก่อนเผยแพร่','コレクターから投稿された写真は公開前に審査されます。','收藏者提交的照片会在发布前审核。'],['Photo review — Admin only','ตรวจสอบรูปภาพ — เฉพาะผู้ดูแล','写真審査 — 管理者専用','照片审核 — 仅管理员'],
    ['Release radar','ติดตามข่าวการวางจำหน่าย','新製品情報','新品动态'],['The radar checks new public announcements daily after the scheduled GitHub workflow is enabled. New matches are leads, not confirmed releases; verify the source before changing a model to Released. This app never silently changes your ownership status.','ระบบจะตรวจประกาศสาธารณะใหม่ทุกวันเมื่อเปิดใช้ GitHub workflow รายการที่พบเป็นเพียงเบาะแส ไม่ใช่ข้อมูลยืนยัน โปรดตรวจสอบแหล่งข้อมูลก่อนเปลี่ยนสถานะเป็นวางจำหน่ายแล้ว แอปจะไม่เปลี่ยนสถานะการครอบครองของคุณเอง','GitHub Actionsを設定すると毎日新しい公開情報を確認します。結果は候補であり確定情報ではありません。発売済みに変更する前に情報元を確認してください。所有状況が自動変更されることはありません。','启用 GitHub 工作流后，系统每天检查新的公开公告。匹配结果仅供参考，并非已确认发布；更改为已发布前请核实来源。本应用不会自动更改您的拥有状态。'],['Notifications','通知','通知','通知'],['Enable iPhone push alerts','开启 iPhone 推送通知','iPhoneのプッシュ通知を有効にする','启用 iPhone 推送提醒'],['Install this app on your Home Screen first. Push requires HTTPS, a configured VAPID key, and the scheduled checker. iPhone permission is requested only when you tap this button.','请先将应用添加到主屏幕。推送通知需要 HTTPS、VAPID 密钥和定时检查器。只有点击此按钮时才会请求 iPhone 权限。','まずホーム画面に追加してください。プッシュ通知にはHTTPS、VAPIDキー、定期チェックの設定が必要です。iPhoneの許可はボタンを押したときのみ求められます。','请先将应用添加到主屏幕。推送需要 HTTPS、已配置的 VAPID 密钥和定时检查器。仅在点击此按钮时请求 iPhone 权限。'],['Backup','备份','バックアップ','备份'],['Export CSV','ส่งออก CSV','CSVを書き出す','导出 CSV'],
    ['Edit all card details','แก้ไขรายละเอียดทั้งหมดของการ์ด','カード情報をすべて編集','编辑卡片全部信息'],['Brand / category','แบรนด์ / หมวดหมู่','ブランド / カテゴリー','品牌 / 类别'],['Vehicle make / model family','ยี่ห้อรถ / ตระกูลรุ่น','自動車メーカー / 車種','汽车品牌 / 车型系列'],['Card title / livery','ชื่อการ์ด / ลวดลาย','カード名 / カラーリング','卡片标题 / 涂装'],['Product code / SKU','รหัสสินค้า / SKU','商品コード / SKU','商品编号 / SKU'],['Edition / variant','รุ่นย่อย / รุ่นพิเศษ','エディション / バリエーション','版本 / 款式'],['Card badge / verification text','ป้ายกำกับ / ข้อความยืนยันบนการ์ด','カードのバッジ / 確認ラベル','卡片徽标 / 验证文字'],['Card image URL (optional)','URL รูปภาพการ์ด (ไม่บังคับ)','カード画像URL（任意）','卡片图片网址（可选）'],['Or choose a photo from your device. It will be resized and saved to the catalogue.','หรือเลือกรูปจากอุปกรณ์ รูปจะถูกปรับขนาดและบันทึกลงแค็ตตาล็อก','または端末から写真を選択してください。サイズを調整してカタログに保存します。','也可以从设备选择照片。照片会调整大小并保存到目录。'],['Choose replacement photo','เลือกรูปภาพทดแทน','差し替え写真を選択','选择替换照片'],['Restore original catalogue photo','คืนค่ารูปภาพเดิมจากแค็ตตาล็อก','カタログの元の写真に戻す','恢复目录原始图片'],['Hide the photo on this card','ซ่อนรูปภาพในการ์ดนี้','このカードの写真を非表示','隐藏此卡片上的照片'],['Product / source link','ลิงก์สินค้า / แหล่งข้อมูล','製品 / 情報元リンク','产品 / 来源链接'],['Release status is shared. Each collector’s Owned / Missing / Wishlist selection remains private to their own garage.','สถานะการวางจำหน่ายจะแชร์กับทุกคน ส่วนสถานะมีแล้ว / ยังไม่มี / สิ่งที่อยากได้เป็นข้อมูลส่วนตัวของนักสะสมแต่ละคน','発売状況は共有されます。所有・未所有・ほしい物リストは各コレクターの個人ガレージに保存されます。','发布状态为共享信息。每位收藏者的已拥有 / 缺少 / 愿望清单仅保存在个人车库中。'],['Cancel','ยกเลิก','キャンセル','取消'],['Save all card details','บันทึกรายละเอียดทั้งหมด','カード情報をすべて保存','保存全部卡片信息'],['Restore original catalogue photo','คืนค่ารูปภาพเดิมจากแค็ตตาล็อก','カタログの元の写真に戻す','恢复目录原始图片'],
    ['Welcome to TURBO 164','ยินดีต้อนรับสู่ TURBO 164','TURBO 164へようこそ','欢迎使用 TURBO 164'],['One account, one private garage. Choose how you want to continue.','หนึ่งบัญชีต่อหนึ่งโรงรถส่วนตัว เลือกวิธีดำเนินการต่อ','1つのアカウントに1つの専用ガレージ。続行方法を選択してください。','一个账户，一个私人车库。请选择继续方式。'],['Continue with Google','ดำเนินการต่อด้วย Google','Googleで続行','使用 Google 继续'],['Continue as guest','เข้าชมในฐานะผู้เยี่ยมชม','ゲストとして続行','以访客身份继续'],['Guests can browse all models. Sign in to create a saved list, mark models Owned or Wishlist, and contribute photos.','ผู้เยี่ยมชมดูรุ่นทั้งหมดได้ เข้าสู่ระบบเพื่อบันทึกรายการ ระบุว่ามีแล้วหรืออยากได้ และส่งรูปภาพ','ゲストは全モデルを閲覧できます。ログインするとリスト保存、所有・ほしい物の設定、写真投稿ができます。','访客可浏览所有款式。登录后可保存列表、标记已拥有或愿望清单，并提交照片。'],['Already using email sign-in?','ใช้การเข้าสู่ระบบด้วยอีเมลอยู่แล้วหรือไม่?','メールでログインしますか？','已使用邮箱登录？'],['Email address','อีเมล','メールアドレス','电子邮件地址'],['Send sign-in link','ส่งลิงก์เข้าสู่ระบบ','ログインリンクを送信','发送登录链接'],['Contribute a model photograph','ส่งรูปถ่ายโมเดล','モデル写真を投稿','提交车型照片'],['Photograph the exact model and livery. Packaging or product code in the photo helps us verify your submission. Images are private until approved.','ถ่ายภาพรุ่นและลวดลายที่ตรงกัน รูปกล่องหรือรหัสสินค้าช่วยตรวจสอบได้ รูปจะยังเป็นส่วนตัวจนกว่าจะอนุมัติ','正確なモデルとカラーリングを撮影してください。箱や商品コードがあると確認に役立ちます。承認までは非公開です。','请拍摄准确的车型和涂装。包装或商品编号有助于核实。照片在获批前不会公开。'],['📷 Take photo','📷 ถ่ายรูป','📷 写真を撮る','📷 拍照'],['Optional note for admin (edition, packaging or source)','หมายเหตุถึงผู้ดูแล (รุ่นย่อย แพ็กเกจ หรือแหล่งข้อมูล)','管理者へのメモ（エディション、パッケージ、情報元）','给管理员的备注（版本、包装或来源）'],['Example: Front of original box shows #68-3','ตัวอย่าง: ด้านหน้ากล่องเดิมระบุ #68-3','例: 元箱の正面に#68-3と記載','例如：原包装正面标有 #68-3'],['I took this photo or have permission to share it in the public TURBO 164 catalogue.','ฉันถ่ายรูปนี้เองหรือได้รับอนุญาตให้นำไปแชร์ในแค็ตตาล็อกสาธารณะ TURBO 164','この写真を自分で撮影したか、TURBO 164の公開カタログで共有する許可を得ています。','我拍摄了此照片或已获准将其分享到 TURBO 164 公共目录。'],['Submit for review','ส่งตรวจสอบ','審査に送信','提交审核'],
    ['Smart Camera v2.6','Smart Camera v2.6','Smart Camera v2.6','Smart Camera v2.6'],['Scan a diecast, compare manufacturers and choose the exact release.','สแกนรถไดแคสต์ เปรียบเทียบผู้ผลิต และเลือกรุ่นที่ตรงกัน','ミニカーをスキャンし、メーカーを比較して正確な製品を選びます。','扫描合金车，对比制造商并选择准确款式。'],['📷 Open Scanner','📷 เปิดเครื่องสแกน','📷 スキャナーを開く','📷 打开扫描器'],['📷 Turbo164 Smart Camera','📷 Turbo164 Smart Camera','📷 Turbo164 スマートカメラ','📷 Turbo164 智能相机'],['Close scanner','ปิดเครื่องสแกน','スキャナーを閉じる','关闭扫描器'],['Scan mode','โหมดสแกน','スキャンモード','扫描模式'],['Packaging','แพ็กเกจ','パッケージ','包装'],['Car Only','รถเท่านั้น','車のみ','仅汽车'],['Frame the printed label or box. The first OCR scan may download reader files.','จัดกรอบให้เห็นฉลากหรือกล่อง การสแกน OCR ครั้งแรกอาจดาวน์โหลดไฟล์อ่านข้อมูล','印刷ラベルまたは箱を枠内に合わせてください。初回のOCRスキャンでは読取ファイルをダウンロードする場合があります。','将印刷标签或包装框入画面。首次 OCR 扫描可能会下载识别文件。'],['📷 Choose photo','📷 เลือกรูป','📷 写真を選択','📷 选择照片'],['Photo with crop outline','รูปภาพพร้อมกรอบครอบตัด','切り抜き枠付き写真','带裁剪框的照片'],['Adjust photo crop','ปรับกรอบรูปภาพ','写真の切り抜きを調整','调整照片裁剪'],['Reset crop','รีเซ็ตกรอบ','切り抜きをリセット','重置裁剪'],['Model name, livery or product code','ชื่อรุ่น ลวดลาย หรือรหัสสินค้า','モデル名、カラーリング、商品コード','车型名称、涂装或商品编号'],['e.g. Porsche Apple 89 or T64-015-AP','เช่น Porsche Apple 89 หรือ T64-015-AP','例: Porsche Apple 89 または T64-015-AP','例如 Porsche Apple 89 或 T64-015-AP'],['Scans run in your browser. Your photo is only shared if you submit it.','การสแกนทำงานในเบราว์เซอร์ รูปของคุณจะแชร์เมื่อคุณส่งเท่านั้น','スキャンはブラウザー内で実行されます。写真は送信した場合のみ共有されます。','扫描在浏览器中运行。仅在您提交时才会分享照片。'],['Read packaging','อ่านข้อความบนแพ็กเกจ','パッケージを読み取る','识别包装'],['Search catalog & releases','ค้นหาแค็ตตาล็อกและรุ่น','カタログと製品を検索','搜索目录和款式'],['2 · Choose manufacturer (searchable)','2 · เลือกผู้ผลิต (ค้นหาได้)','2 · メーカーを選択（検索可能）','2 · 选择制造商（可搜索）'],['Filter manufacturer names…','กรองชื่อผู้ผลิต…','メーカー名を絞り込む…','筛选制造商名称…'],['Search manufacturers','ค้นหาผู้ผลิต','メーカーを検索','搜索制造商'],['Manufacturer options','ตัวเลือกผู้ผลิต','メーカーの選択肢','制造商选项'],['Manufacturer not listed','ไม่มีชื่อผู้ผลิตในรายการ','メーカーが見つからない','未列出的制造商'],['Enter the exact diecast manufacturer','กรอกชื่อผู้ผลิตรถไดแคสต์ให้ตรง','正確なミニカーメーカー名を入力','输入准确的合金车制造商'],['3 · Choose exact release / package','3 · เลือกรุ่น / แพ็กเกจให้ตรง','3 · 正確な製品 / パッケージを選択','3 · 选择准确款式 / 包装'],['Search to find possible releases.','ค้นหาเพื่อดูรุ่นที่อาจตรงกัน','検索して候補を表示します。','搜索以查找可能的款式。'],['A matching livery is not proof of the manufacturer, vehicle generation, SKU, or edition. Check the product code and packaging before saving a catalog match.','ลวดลายที่คล้ายกันไม่ได้ยืนยันผู้ผลิต เจเนอเรชันรถ SKU หรือรุ่นย่อย โปรดตรวจรหัสสินค้าและแพ็กเกจก่อนบันทึกรุ่น','カラーリングが似ていてもメーカー、車両世代、SKU、エディションの証明にはなりません。商品コードとパッケージを確認して保存してください。','涂装相似并不能证明制造商、车辆代次、SKU 或版本。保存目录匹配项前，请核对商品编号和包装。'],
    ['All manufacturers','ผู้ผลิตทั้งหมด','すべてのメーカー','所有制造商'],['Other / Not listed +','อื่น ๆ / ไม่มีในรายการ +','その他 / 見つからない +','其他 / 未列出 +'],['In Turbo164 catalog','อยู่ในแค็ตตาล็อก Turbo164','Turbo164カタログ掲載','收录于 Turbo164 目录'],['Research lead · not published','ข้อมูลค้นคว้า · ยังไม่เผยแพร่','調査候補 · 未公開','研究线索 · 尚未发布'],['Product code:','รหัสสินค้า:','商品コード:','商品编号：'],['Choose this catalog model','เลือกรุ่นนี้จากแค็ตตาล็อก','このカタログモデルを選択','选择此目录车型'],['Review this exact release','ตรวจสอบรุ่นนี้','この製品を確認','核对此款产品'],['Browse related releases','ดูรุ่นที่เกี่ยวข้อง','関連製品を見る','浏览相关款式'],['Source','แหล่งข้อมูล','情報元','来源'],['Scan a car or search model name, number, or code to see possible matches.','สแกนรถหรือค้นหาชื่อรุ่น หมายเลข หรือรหัสเพื่อดูรายการที่อาจตรงกัน','車をスキャンするか、モデル名、番号、コードで候補を検索してください。','扫描汽车或搜索车型名称、编号、代码以查看可能匹配项。'],['Enter a model, livery or product code. Try “Porsche Apple 89”.','กรอกชื่อรุ่น ลวดลาย หรือรหัสสินค้า ลอง “Porsche Apple 89”','モデル名、カラーリング、商品コードを入力してください。例: “Porsche Apple 89”','输入车型、涂装或商品编号。试试 “Porsche Apple 89”。'],['Visual lookalikes ·','รูปที่มีลักษณะคล้ายกัน ·','見た目が似た候補 ·','外观相似项 ·'],['Related vehicle releases ·','รุ่นรถที่เกี่ยวข้อง ·','関連する車種の製品 ·','相关车型款式 ·'],['possible releases','รุ่นที่อาจตรงกัน','件の候補製品','个可能款式'],['across manufacturers','จากผู้ผลิตทั้งหมด','全メーカー','所有制造商'],['not guaranteed identifications','ไม่รับประกันว่าเป็นรุ่นที่ถูกต้อง','特定を保証するものではありません','不保证识别准确'],['No catalog match found. Search the web to help identify this release.','ไม่พบรุ่นในแค็ตตาล็อก ค้นหาเว็บเพื่อช่วยระบุรุ่นนี้','カタログに一致する製品がありません。ウェブ検索で特定してください。','未找到目录匹配项。请搜索网页以协助识别此款产品。'],['🌐 Search web for this release','🌐 ค้นหาเว็บสำหรับรุ่นนี้','🌐 この製品をウェブ検索','🌐 搜索此款产品'],['Showing top 40. Refine your search or choose a manufacturer.','แสดง 40 รายการแรก ปรับการค้นหาหรือเลือกผู้ผลิต','上位40件を表示中。検索条件を絞るかメーカーを選択してください。','显示前 40 项。请细化搜索或选择制造商。'],['Selected release','รุ่นที่เลือก','選択した製品','已选款式'],['Compare the actual car and check the markings before saving this release.','เปรียบเทียบกับรถจริงและตรวจเครื่องหมายก่อนบันทึกรุ่นนี้','保存する前に実車と比較し、刻印を確認してください。','保存前请与实车对比并检查标记。'],['Find related catalog releases','ค้นหารุ่นในแค็ตตาล็อกที่เกี่ยวข้อง','関連するカタログ製品を検索','查找相关目录款式'],['Search web for selected release','ค้นหาเว็บสำหรับรุ่นที่เลือก','選択した製品をウェブ検索','搜索已选款式'],['Add Owned','เพิ่มในรายการมีแล้ว','所有に追加','添加到已拥有'],['Add Ordered','เพิ่มในรายการสั่งซื้อแล้ว','注文済みに追加','添加到已订购'],['This release is not yet in the Turbo164 catalog. No matching catalog entry is available.','รุ่นนี้ยังไม่มีในแค็ตตาล็อก Turbo164 และไม่พบรายการที่ตรงกัน','この製品はまだTurbo164カタログに登録されていません。一致する項目はありません。','此款产品尚未收录于 Turbo164 目录，目前没有匹配条目。'],
    ['Please select a photograph.','โปรดเลือกรูปภาพ','写真を選択してください。','请选择照片。'],['Original image must be under 25 MB.','รูปต้นฉบับต้องมีขนาดไม่เกิน 25 MB','元画像は25 MB未満にしてください。','原始图片须小于 25 MB。'],['Preparing photo…','กำลังเตรียมรูปภาพ…','写真を準備中…','正在准备照片…'],['Adjust the crop to frame your subject, then scan.','ปรับกรอบให้พอดีกับวัตถุ แล้วสแกน','対象が枠内に入るよう調整してからスキャンしてください。','调整裁剪框以对准主体，然后扫描。'],['Read packaging','อ่านข้อความบนแพ็กเกจ','パッケージを読み取る','识别包装'],['Find lookalikes','ค้นหารุ่นที่มีลักษณะคล้ายกัน','似たモデルを探す','查找相似车型'],['Car Only','รถเท่านั้น','車のみ','仅汽车'],['Smart Camera fills this draft','Smart Camera กรอกร่างนี้','Smart Cameraが下書きを入力','智能相机填写此草稿'],
    ['Browse the catalogue. Log in to create a saved list; cloud sign-in must be configured first.','ดูแค็ตตาล็อก เข้าสู่ระบบเพื่อบันทึกรายการ โดยต้องตั้งค่าการเข้าสู่ระบบคลาวด์ก่อน','カタログを閲覧できます。リストを保存するにはログインしてください。クラウドログインの設定が必要です。','浏览目录。登录后可创建保存列表；请先配置云登录。'],['Guest preview','โหมดตัวอย่างสำหรับผู้เยี่ยมชม','ゲストプレビュー','访客预览'],['Guest mode','โหมดผู้เยี่ยมชม','ゲストモード','访客模式'],['Browse all four brands freely. To create a saved list or change a model’s status, log in with Google or email.','ดูทั้ง 4 แบรนด์ได้อย่างอิสระ หากต้องการบันทึกรายการหรือเปลี่ยนสถานะรุ่น โปรดเข้าสู่ระบบด้วย Google หรืออีเมล','4ブランドすべてを閲覧できます。リスト保存や状態変更にはGoogleまたはメールでログインしてください。','可自由浏览四个品牌。登录 Google 或邮箱后即可保存列表或更改款式状态。'],['☁ Cloud sync enabled','☁ เปิดซิงก์คลาวด์แล้ว','☁ クラウド同期中','☁ 云同步已启用'],['Signed in:','เข้าสู่ระบบแล้ว:','ログイン中:','已登录：'],['Your private garage is loaded.','โหลดโรงรถส่วนตัวแล้ว','マイガレージを読み込みました。','个人车库已加载。'],['Your garage has been refreshed.','รีเฟรชโรงรถแล้ว','ガレージを更新しました。','车库已刷新。'],['Public catalogue refreshed. Log in to save a personal list.','รีเฟรชแค็ตตาล็อกสาธารณะแล้ว เข้าสู่ระบบเพื่อบันทึกรายการส่วนตัว','公開カタログを更新しました。個人リストの保存にはログインしてください。','公共目录已刷新。登录后可保存个人列表。'],['No release leads have been collected yet. Enable the scheduled checker in GitHub Actions, then refresh.','ยังไม่มีข้อมูลรุ่นใหม่ เปิดตัวตรวจสอบตามกำหนดเวลาใน GitHub Actions แล้วรีเฟรช','新製品候補はまだありません。GitHub Actionsで定期チェックを有効にして更新してください。','尚未收集到新品线索。请在 GitHub Actions 中启用定时检查，然后刷新。'],['View source ↗','ดูแหล่งข้อมูล ↗','情報元を見る ↗','查看来源 ↗'],['No matching models.','ไม่พบรุ่นที่ตรงกัน','一致するモデルがありません。','没有匹配车型。'],['No models submitted yet.','ยังไม่มีการส่งรุ่น','まだ製品申請はありません。','尚未提交款式。'],['No pending photographs.','ไม่มีรูปภาพที่รอตรวจสอบ','審査待ちの写真はありません。','没有待审核照片。'],['No pending model submissions.','ไม่มีรุ่นที่รอตรวจสอบ','審査待ちの製品申請はありません。','没有待审核的款式。'],['Export CSV','ส่งออก CSV','CSVを書き出す','导出 CSV']
  ];
  rows.push(
    ['Cloud sync enabled','เปิดซิงก์คลาวด์แล้ว','クラウド同期中','云同步已启用'],
    ['Guest · browsing only','ผู้เยี่ยมชม · ดูอย่างเดียว','ゲスト · 閲覧のみ','访客 · 仅浏览'],
    ['Choose a status for','เลือกสถานะสำหรับ','状態を選択','选择状态：'],
    ['Collection status for','สถานะคอลเล็กชันของ','コレクションの状態','收藏状态：'],
    ['In Turbo164 catalog','อยู่ในแค็ตตาล็อก Turbo164','Turbo164カタログ掲載','收录于 Turbo164 目录'],
    ['Research lead · not published','ข้อมูลค้นคว้า · ยังไม่เผยแพร่','調査候補 · 未公開','研究线索 · 尚未发布'],
    ['Choose this catalog model','เลือกรุ่นนี้จากแค็ตตาล็อก','このカタログモデルを選択','选择此目录车型'],
    ['Review this exact release','ตรวจสอบรุ่นนี้','この製品を確認','核对此款产品'],
    ['Browse related releases','ดูรุ่นที่เกี่ยวข้อง','関連製品を見る','浏览相关款式'],
    ['Source','แหล่งข้อมูล','情報元','来源'],
    ['📷 Open Scanner','📷 เปิดเครื่องสแกน','📷 スキャナーを開く','📷 打开扫描器'],
    ['Read car text','อ่านข้อความบนรถ','車体の文字を読み取る','识别车身文字'],
    ['Read package text','อ่านข้อความบนแพ็กเกจ','パッケージの文字を読み取る','识别包装文字'],
    ['Scan a car or search model name, number, or code to see possible matches.','สแกนรถหรือค้นหาชื่อรุ่น หมายเลข หรือรหัสเพื่อดูรายการที่อาจตรงกัน','車をスキャンするか、モデル名、番号、コードで候補を検索してください。','扫描汽车或搜索车型名称、编号、代码以查看可能匹配项。'],
    ['Too little detail to compare. Crop closer around the car or try a clearer photo.','ข้อมูลไม่พอสำหรับเปรียบเทียบ ลองครอบตัดให้ใกล้รถขึ้นหรือใช้รูปที่ชัดกว่า','比較する情報が不足しています。車に近づけて切り抜くか、鮮明な写真をお試しください。','可比较的信息太少。请更紧密地裁剪汽车或尝试更清晰的照片。'],
    ['No identifying text was readable on the loose car. Free OCR cannot identify a car by its shape. Enter a make/model or scan the package; no unrelated car was selected.','ไม่พบข้อความระบุตัวตนบนรถ OCR ฟรีไม่สามารถระบุรถจากรูปร่างได้ โปรดกรอกยี่ห้อ/รุ่นหรือสแกนแพ็กเกจ ระบบไม่ได้เลือกรถที่ไม่เกี่ยวข้อง','車体から識別できる文字を読み取れませんでした。無料OCRは形状だけで車を特定できません。メーカー/モデルを入力するかパッケージをスキャンしてください。無関係な車は選択されていません。','未能读取车身上的识别文字。免费 OCR 无法仅凭外形识别汽车。请输入品牌/车型或扫描包装；系统未选择无关车型。'],
    ['Text was read locally. Review possible catalog matches and confirm the exact release.','อ่านข้อความบนอุปกรณ์แล้ว ตรวจสอบรายการที่ตรงกันและยืนยันรุ่นให้ถูกต้อง','端末内で文字を読み取りました。カタログ候補を確認し、製品を特定してください。','已在本地读取文字。请查看目录匹配项并确认具体款式。'],
    ['Take or upload a photo first.','ถ่ายหรืออัปโหลดรูปก่อน','先拍摄或上传照片。','请先拍摄或上传照片。'],
    ['Preparing local text scan…','กำลังเตรียมสแกนข้อความในอุปกรณ์…','端末内の文字スキャンを準備中…','正在准备本地文字扫描…'],
    ['Enter a model name or product code before searching the web.','กรอกชื่อรุ่นหรือรหัสสินค้าก่อนค้นหาเว็บ','ウェブ検索の前にモデル名または商品コードを入力してください。','搜索网页前请输入车型名称或商品编号。'],
    ['Web search opened. Verify the manufacturer, SKU and source before submitting a new release.','เปิดการค้นหาเว็บแล้ว โปรดตรวจสอบผู้ผลิต SKU และแหล่งข้อมูลก่อนส่งรุ่นใหม่','ウェブ検索を開きました。新製品を申請する前にメーカー、SKU、情報元を確認してください。','已打开网页搜索。提交新款前请核实制造商、SKU 和来源。'],
    ['Garage saving is not available.','ไม่สามารถบันทึกลงโรงรถได้','ガレージに保存できません。','无法保存到车库。'],
    ['Select or enter the diecast manufacturer first.','เลือกหรือกรอกชื่อผู้ผลิตรถไดแคสต์ก่อน','先にミニカーメーカーを選択または入力してください。','请先选择或输入合金车制造商。'],
    ['Enter a valid manufacturer.','กรอกชื่อผู้ผลิตที่ถูกต้อง','有効なメーカー名を入力してください。','请输入有效的制造商。'],
    ['Enter the model name in the search field before opening a missing-model draft.','กรอกชื่อรุ่นในช่องค้นหาก่อนเปิดแบบฟอร์มรุ่นที่ไม่มีในรายการ','未登録モデルの申請を開く前に検索欄へモデル名を入力してください。','打开缺失款式草稿前，请先在搜索框中输入车型名称。'],
    ['This model and edition are already listed. Please use a distinct model / livery name for a genuinely different release.','มีรุ่นและรุ่นย่อยนี้อยู่แล้ว โปรดใช้ชื่อรุ่น/ลวดลายที่แตกต่างสำหรับรุ่นที่ไม่ซ้ำ','このモデルとエディションは既に登録されています。別製品の場合は異なるモデル名/カラーリングを入力してください。','此车型和版本已列出。若为不同款式，请使用不同的车型 / 涂装名称。'],
    ['This model and edition are already listed. Please use a distinct model / livery name for a genuinely different release.','มีรุ่นและรุ่นย่อยนี้อยู่แล้ว โปรดใช้ชื่อรุ่น/ลวดลายที่แตกต่างสำหรับรุ่นที่ไม่ซ้ำ','このモデルとエディションは既に登録されています。別製品の場合は異なるモデル名/カラーリングを入力してください。','此车型和版本已列出。若为不同款式，请使用不同的车型 / 涂装名称。'],
    ['Submission received! It remains private until an administrator approves it.','ได้รับข้อมูลแล้ว ข้อมูลจะยังเป็นส่วนตัวจนกว่าผู้ดูแลจะอนุมัติ','申請を受け付けました。管理者が承認するまで非公開です。','已收到提交内容。管理员批准前将保持私密。'],
    ['Sign in to see your proposals and their review statuses.','เข้าสู่ระบบเพื่อดูรายการที่ส่งและสถานะการตรวจสอบ','申請内容と審査状況を確認するにはログインしてください。','登录以查看您提交的款式及审核状态。'],
    ['Loading pending photos…','กำลังโหลดรูปภาพที่รอตรวจสอบ…','審査待ちの写真を読み込み中…','正在加载待审核照片…'],
    ['Loading model proposals…','กำลังโหลดข้อเสนอรุ่นใหม่…','製品申請を読み込み中…','正在加载款式提案…'],
    ['Submit for review','ส่งตรวจสอบ','審査に送信','提交审核'],
    ['Photos submitted by collectors are reviewed before publication.','รูปภาพที่นักสะสมส่งมาจะได้รับการตรวจสอบก่อนเผยแพร่','コレクターから投稿された写真は公開前に審査されます。','收藏者提交的照片会在发布前审核。'],
    ['Add Owned','เพิ่มในรายการมีแล้ว','所有に追加','添加到已拥有'],
    ['Add Ordered','เพิ่มในรายการสั่งซื้อแล้ว','注文済みに追加','添加到已订购'],
    ['No matching models.','ไม่พบรุ่นที่ตรงกัน','一致するモデルがありません。','没有匹配车型。'],
    ['No release leads have been collected yet. Enable the scheduled checker in GitHub Actions, then refresh.','ยังไม่มีข้อมูลรุ่นใหม่ เปิดตัวตรวจสอบตามกำหนดเวลาใน GitHub Actions แล้วรีเฟรช','新製品候補はまだありません。GitHub Actionsで定期チェックを有効にして更新してください。','尚未收集到新品线索。请在 GitHub Actions 中启用定时检查，然后刷新。'],
    ['A matching livery is not proof of the manufacturer, vehicle generation, SKU, or edition. Check the product code and packaging before saving a catalog match.','ลวดลายที่คล้ายกันไม่ได้ยืนยันผู้ผลิต เจเนอเรชันรถ SKU หรือรุ่นย่อย โปรดตรวจรหัสสินค้าและแพ็กเกจก่อนบันทึกรุ่น','カラーリングが似ていてもメーカー、車両世代、SKU、エディションの証明にはなりません。商品コードとパッケージを確認して保存してください。','涂装相似并不能证明制造商、车辆代次、SKU 或版本。保存目录匹配项前，请核对商品编号和包装。'],
    ['Not tracking','ยังไม่ติดตาม','未登録','未跟踪'],
    ['SKU pending','รอ SKU','SKU未登録','SKU 待定'],
    ['Community verified','ชุมชนยืนยันแล้ว','コミュニティ確認済み','社区已验证'],
    ['Approve photo','อนุมัติรูปภาพ','写真を承認','批准照片'],
    ['Reject','ปฏิเสธ','却下','拒绝'],
    ['Approve & publish','อนุมัติและเผยแพร่','承認して公開','批准并发布'],
    ['Edit label','แก้ไขป้ายกำกับ','ラベルを編集','编辑标签'],
    ['Choose a matching catalog model','เลือกรุ่นจากแค็ตตาล็อกที่ตรงกัน','一致するカタログモデルを選択','选择匹配的目录车型'],
    ['Search web for this release','ค้นหาเว็บสำหรับรุ่นนี้','この製品をウェブ検索','搜索此款产品'],
    ['Photo awaiting review','รูปภาพรอตรวจสอบ','写真の審査待ち','照片待审核'],
    ['📷 Suggest replacement photo','📷 เสนอรูปภาพทดแทน','📷 差し替え写真を提案','📷 建议替换照片'],
    ['📷 Contribute a photo','📷 ส่งรูปภาพ','📷 投稿写真','📷 提交照片'],
    ['Photos submitted by collectors are reviewed before publication.','รูปภาพที่นักสะสมส่งมาจะได้รับการตรวจสอบก่อนเผยแพร่','コレクターから投稿された写真は公開前に審査されます。','收藏者提交的照片会在发布前审核。'],
    ['Model review — Admin only','ตรวจสอบรุ่น — เฉพาะผู้ดูแล','製品審査 — 管理者専用','款式审核 — 仅管理员'],
    ['Photo review — Admin only','ตรวจสอบรูปภาพ — เฉพาะผู้ดูแล','写真審査 — 管理者専用','照片审核 — 仅管理员'],
    ['Enable iPhone push alerts','เปิดการแจ้งเตือน iPhone','iPhoneの通知を有効化','启用 iPhone 推送提醒'],
    ['Backup','สำรองข้อมูล','バックアップ','备份'],
    ['Sign in to cloud sync first.','เข้าสู่ระบบเพื่อซิงก์คลาวด์ก่อน','先にログインしてクラウド同期してください。','请先登录以启用云同步。'],
    ['Choose an image file.','เลือกไฟล์รูปภาพ','画像ファイルを選択してください。','请选择图片文件。'],
    ['That image is too large. Please select one under 25 MB.','รูปภาพใหญ่เกินไป โปรดเลือกรูปที่มีขนาดต่ำกว่า 25 MB','画像が大きすぎます。25 MB未満の画像を選択してください。','图片过大，请选择小于 25 MB 的图片。'],
    ['Photo ready. Please confirm permission before submitting.','เตรียมรูปภาพแล้ว โปรดยืนยันสิทธิ์ก่อนส่ง','写真の準備ができました。送信前に許可を確認してください。','照片已准备好。提交前请确认拥有使用权限。'],
    ['Please sign in first.','โปรดเข้าสู่ระบบก่อน','先にログインしてください。','请先登录。'],
    ['Choose or take a photograph first.','เลือกรูปหรือถ่ายรูปก่อน','先に写真を選択または撮影してください。','请先选择或拍摄照片。'],
    ['Photo submitted for review. It will not appear publicly until approved.','ส่งรูปภาพเพื่อตรวจสอบแล้ว รูปจะไม่ปรากฏต่อสาธารณะจนกว่าจะอนุมัติ','写真を審査に送信しました。承認されるまで公開されません。','照片已提交审核，获批前不会公开。'],
    ['No pending photographs.','ไม่มีรูปภาพที่รอตรวจสอบ','審査待ちの写真はありません。','没有待审核照片。'],
    ['No pending model submissions.','ไม่มีรุ่นที่รอตรวจสอบ','審査待ちの製品申請はありません。','没有待审核的款式。'],
    ['The scanner compares shape and color against accessible catalog photos. Viewpoint and background can affect results. Verify the manufacturer, edition and SKU yourself.','เครื่องสแกนเปรียบเทียบรูปร่างและสีกับรูปในแค็ตตาล็อก มุมมองและพื้นหลังอาจส่งผลต่อผลลัพธ์ โปรดตรวจสอบผู้ผลิต รุ่นย่อย และ SKU ด้วยตนเอง','スキャナーは形状と色をカタログ写真と比較します。角度や背景で結果が変わる場合があります。メーカー、エディション、SKUを確認してください。','扫描器会将外形和颜色与目录照片进行比较。视角和背景可能影响结果，请自行核实制造商、版本和 SKU。'],
    ['Crop tightly around the loose car.','ครอบตัดให้ชิดรอบตัวรถ','車体の周囲をぴったり切り抜いてください。','紧密裁剪汽车周围。'],
    ['Search web for selected release','ค้นหาเว็บสำหรับรุ่นที่เลือก','選択した製品をウェブ検索','搜索已选款式'],
    ['Submit release for review','ส่งรุ่นให้ตรวจสอบ','製品情報を審査に送信','提交款式以供审核'],
    ['Cancel','ยกเลิก','キャンセル','取消'],
    ['Save all card details','บันทึกรายละเอียดทั้งหมด','カード情報をすべて保存','保存全部卡片信息'],
    ['No matching models.','ไม่พบรุ่นที่ตรงกัน','一致するモデルがありません。','没有匹配车型。'],
    ['Please choose a supported brand and enter model information.','โปรดเลือกแบรนด์ที่รองรับและกรอกข้อมูลรุ่น','対応ブランドを選び、モデル情報を入力してください。','请选择受支持的品牌并填写款式信息。'],
    ['Enter a valid release year.','กรอกปีที่วางจำหน่ายให้ถูกต้อง','有効な発売年を入力してください。','请输入有效的发布年份。'],
    ['Sign in to create a saved list','เข้าสู่ระบบเพื่อสร้างรายการที่บันทึกไว้','保存リストを作成するにはログイン','登录以创建已保存列表'],
    ['A free account lets you mark models Owned, Ordered, Missing or Wishlist and save your garage across devices.','บัญชีฟรีช่วยให้คุณระบุรุ่นที่มีแล้ว สั่งซื้อแล้ว ยังไม่มี หรืออยากได้ และบันทึกโรงรถข้ามอุปกรณ์','無料アカウントで所有、注文済み、未所有、ほしい物を設定し、複数端末でガレージを保存できます。','免费账户可标记已拥有、已订购、缺少或愿望清单，并在不同设备间保存车库。'],
    ['One account, one private garage. Choose how you want to continue.','หนึ่งบัญชีต่อหนึ่งโรงรถส่วนตัว เลือกวิธีดำเนินการต่อ','1つのアカウントに1つの専用ガレージ。続行方法を選択してください。','一个账户，一个私人车库。请选择继续方式。'],
    ['Could not upload replacement photo:','อัปโหลดรูปภาพทดแทนไม่สำเร็จ:','差し替え写真をアップロードできませんでした:','无法上传替换照片：'],
    ['Could not save item:','บันทึกรายการไม่สำเร็จ:','項目を保存できませんでした:','无法保存项目：'],
    ['Could not prepare photo:','เตรียมรูปภาพไม่สำเร็จ:','写真を準備できませんでした:','无法准备照片：'],
    ['Could not sign out:','ออกจากระบบไม่สำเร็จ:','ログアウトできませんでした:','无法退出登录：'],
    ['Refresh failed:','รีเฟรชไม่สำเร็จ:','更新に失敗しました:','刷新失败：'],
    ['Collection loaded, but custom models are unavailable. Run the v2 SQL migration.','โหลดคอลเล็กชันแล้ว แต่ไม่สามารถใช้รุ่นที่กำหนดเองได้ โปรดใช้ SQL migration v2','コレクションを読み込みましたが、カスタムモデルを利用できません。v2 SQL移行を実行してください。','收藏已加载，但自定义款式不可用。请运行 v2 SQL 迁移。'],
    ['Signed out. You are now browsing as a guest.','ออกจากระบบแล้ว ขณะนี้กำลังดูในฐานะผู้เยี่ยมชม','ログアウトしました。ゲストとして閲覧中です。','已退出登录。您现在以访客身份浏览。'],
    ['Your private garage is loaded.','โหลดโรงรถส่วนตัวแล้ว','マイガレージを読み込みました。','个人车库已加载。'],
    ['Shared card details updated for all collectors.','อัปเดตรายละเอียดการ์ดที่แชร์ให้ผู้สะสมทุกคนแล้ว','共有カード情報を全コレクター向けに更新しました。','已为所有收藏者更新共享卡片信息。'],
    ['Vehicle make and model title are required.','จำเป็นต้องกรอกยี่ห้อรถและชื่อรุ่น','メーカー名とモデル名は必須です。','汽车品牌和车型标题为必填项。'],
    ['Image and source must be valid http or https URLs.','รูปภาพและแหล่งข้อมูลต้องเป็น URL http หรือ https ที่ถูกต้อง','画像と情報元には有効なhttpまたはhttpsのURLを入力してください。','图片和来源必须是有效的 http 或 https 网址。'],
    ['Replacement photo ready.','เตรียมรูปภาพทดแทนแล้ว','差し替え写真の準備ができました。','替换照片已准备好。'],
    ['The selected release','รุ่นที่เลือก','選択した製品','已选款式'],
    ['Review this exact release','ตรวจสอบรุ่นนี้','この製品を確認','核对此款产品'],
    ['Search web for this release','ค้นหาเว็บสำหรับรุ่นนี้','この製品をウェブ検索','搜索此款产品'],
    ['SKU pending','รอ SKU','SKU未登録','SKU 待定'],
    ['Photo could not be copied:','คัดลอกรูปภาพไม่สำเร็จ:','写真をコピーできませんでした:','无法复制照片：'],
    ['Smart Camera filled this draft. Verify the product code, edition and source; submit for administrator approval. For new brands, the Supabase brand constraint migration must be applied.','Smart Camera กรอกร่างนี้แล้ว โปรดตรวจรหัสสินค้า รุ่นย่อย และแหล่งข้อมูลก่อนส่งให้ผู้ดูแลอนุมัติ แบรนด์ใหม่ต้องใช้ Supabase migration เพื่ออัปเดตข้อกำหนดแบรนด์','Smart Cameraが下書きを入力しました。商品コード、エディション、情報元を確認して管理者の承認に送信してください。新しいブランドにはSupabaseの制約移行が必要です。','智能相机已填写此草稿。请核对商品编号、版本和来源后提交管理员批准。新品牌需应用 Supabase 品牌约束迁移。'],
    ['Loading pending photos…','กำลังโหลดรูปภาพที่รอตรวจสอบ…','審査待ちの写真を読み込み中…','正在加载待审核照片…'],
    ['Review queue unavailable:','ไม่สามารถเปิดคิวตรวจสอบได้:','審査キューを利用できません:','审核队列不可用：'],
    ['Photo submitted for review. It will not appear publicly until approved.','ส่งรูปภาพเพื่อตรวจสอบแล้ว รูปจะไม่ปรากฏต่อสาธารณะจนกว่าจะอนุมัติ','写真を審査に送信しました。承認されるまで公開されません。','照片已提交审核，获批前不会公开。'],
    ['Awaiting review','รอตรวจสอบ','審査待ち','待审核'],
    ['Approved','อนุมัติแล้ว','承認済み','已批准'],
    ['Rejected','ถูกปฏิเสธ','却下','已拒绝'],
    ['This model and edition are already listed.','มีรุ่นและรุ่นย่อยนี้อยู่ในรายการแล้ว','このモデルとエディションは既に登録されています。','此车型和版本已列出。'],
    ['Model name / livery','ชื่อรุ่น / ลวดลาย','モデル名 / カラーリング','车型名称 / 涂装'],
    ['Photo selected for contribution','เลือกรูปภาพเพื่อส่ง','投稿用に選択した写真','已选择要提交的照片'],
    ['Reference photo for','รูปอ้างอิงของ','参照写真:','参考照片：'],
    ['View source ↗','ดูแหล่งข้อมูล ↗','情報元を見る ↗','查看来源 ↗'],
    ['No catalog match found. Search the web to help identify this release.','ไม่พบรุ่นในแค็ตตาล็อก ค้นหาเว็บเพื่อช่วยระบุรุ่นนี้','カタログに一致する製品がありません。ウェブ検索で特定してください。','未找到目录匹配项。请搜索网页以协助识别此款产品。']
  );
  rows.push(
    ['Product categories','หมวดหมู่สินค้า','商品カテゴリー','商品类别'],
    ['Back to top','กลับไปด้านบน','ページの先頭へ','返回顶部'],
    ['Diecast','รถไดแคสต์','ミニカー','合金车'],
    ['Diorama','ฉากไดโอรามา','ジオラマ','场景模型'],
    ['Figure','ฟิกเกอร์','フィギュア','人偶'],
    ['Accessory','อุปกรณ์เสริม','アクセサリー','配件'],
    ['Other','อื่น ๆ','その他','其他'],
    ['Diecast ▾','รถไดแคสต์ ▾','ミニカー ▾','合金车 ▾'],
    ['All brands','ทุกแบรนด์','すべてのブランド','所有品牌'],
    ['Diecast catalogue','แค็ตตาล็อกรถไดแคสต์','ミニカーカタログ','合金车目录'],
    ['ARBOX catalogue','แค็ตตาล็อก ARBOX','ARBOXカタログ','ARBOX 目录'],
    ['PGM catalogue','แค็ตตาล็อก PGM','PGMカタログ','PGM 目录'],
    ['Tarmac Works catalogue','แค็ตตาล็อก Tarmac Works','Tarmac Worksカタログ','Tarmac Works 目录'],
    ['INNO64 catalogue','แค็ตตาล็อก INNO64','INNO64カタログ','INNO64 目录'],
    ['Diorama catalogue','แค็ตตาล็อกฉากไดโอรามา','ジオラマカタログ','场景模型目录'],
    ['Figure catalogue','แค็ตตาล็อกฟิกเกอร์','フィギュアカタログ','人偶目录'],
    ['Accessory catalogue','แค็ตตาล็อกอุปกรณ์เสริม','アクセサリーカタログ','配件目录'],
    ['Other catalogue','แค็ตตาล็อกอื่น ๆ','その他のカタログ','其他目录'],
    ['Diorama collection','หมวดฉากไดโอรามา','ジオラマコレクション','场景模型分类'],
    ['Figure collection','หมวดฟิกเกอร์','フィギュアコレクション','人偶分类'],
    ['Accessory collection','หมวดอุปกรณ์เสริม','アクセサリーコレクション','配件分类'],
    ['Other collection','หมวดอื่น ๆ','その他のコレクション','其他分类'],
    ['No listings yet in this category.','ยังไม่มีรายการในหมวดหมู่นี้','このカテゴリーにはまだ登録がありません。','此类别暂无条目。'],
    ['Items added here will appear in their own catalogue.','รายการที่เพิ่มจะปรากฏในแค็ตตาล็อกของหมวดนี้','ここに追加されたアイテムは専用カタログに表示されます。','添加到此处的条目会显示在对应目录中。'],
    ['0 items','0 รายการ','0 件','0 个条目']
  );
  rows.push(
    ['Filter diecast releases','กรองรุ่นรถไดแคสต์','ミニカー製品を絞り込む','筛选合金车款式'],
    ['All diecast models','รถไดแคสต์ทั้งหมด','すべてのミニカー','所有合金车款式'],
    ['Car manufacturer','ผู้ผลิตรถยนต์','自動車メーカー','汽车制造商'],
    ['‹ Back','‹ ย้อนกลับ','‹ 戻る','‹ 返回'],
    ['‹ All brands','‹ ทุกแบรนด์','‹ すべてのブランド','‹ 所有品牌'],
    ['No diecast brands are listed yet.','ยังไม่มีแบรนด์รถไดแคสต์ในรายการ','ミニカーブランドはまだ登録されていません。','尚未列出合金车品牌。'],
    ['No car manufacturers are listed in this catalog.','ยังไม่มีผู้ผลิตรถยนต์ในแค็ตตาล็อกนี้','このカタログには自動車メーカーがまだ登録されていません。','此目录中尚未列出汽车制造商。'],
    ['catalogue','แค็ตตาล็อก','カタログ','目录'],
    ['All brands','ทุกแบรนด์','すべてのブランド','所有品牌'],
    ['All brands ›','ทุกแบรนด์ ›','すべてのブランド ›','所有品牌 ›'],
    ['Choose brand','เลือกแบรนด์','ブランドを選択','选择品牌']
  );
  rows.push(
    ['Community','ชุมชน','コミュニティ','社区'],
    ['💬 Community','💬 ชุมชน','💬 コミュニティ','💬 社区'],
    ['↻ Refresh feed','↻ รีเฟรชฟีด','↻ フィードを更新','↻ 刷新动态'],
    ['← Back to catalogue','← กลับไปแค็ตตาล็อก','← カタログに戻る','← 返回目录'],
    ['← Back to Community','← กลับไปที่ชุมชน','← コミュニティに戻る','← 返回社区'],
    ['▣ Saved community posts','▣ โพสต์ชุมชนที่บันทึกไว้','▣ 保存したコミュニティ投稿','▣ 已保存的社区帖子'],
    ['Log in to use Community','เข้าสู่ระบบเพื่อใช้ชุมชน','コミュニティを利用するにはログイン','登录以使用社区'],
    ['Choose media','เลือกสื่อ','メディアを選択','选择媒体'],
    ['Loading comments…','กำลังโหลดความคิดเห็น…','コメントを読み込み中…','正在加载评论…'],
    ['Log in to react in the community.','เข้าสู่ระบบเพื่อแสดงความรู้สึกในชุมชน','コミュニティでリアクションするにはログイン','登录后才能在社区互动。'],
    ['Log in to save posts in the community.','เข้าสู่ระบบเพื่อบันทึกโพสต์ในชุมชน','コミュニティの投稿を保存するにはログイン','登录后才能收藏社区帖子。'],
    ['Log in to comment in the community.','เข้าสู่ระบบเพื่อแสดงความคิดเห็นในชุมชน','コミュニティにコメントするにはログイン','登录后才能在社区发表评论。'],
    ['Log in to post in the community.','เข้าสู่ระบบเพื่อโพสต์ในชุมชน','コミュニティに投稿するにはログイン','登录后才能在社区发帖。'],
    ['Log in to save posts, react, comment, and publish.','เข้าสู่ระบบเพื่อบันทึกโพสต์ แสดงความรู้สึก แสดงความคิดเห็น และเผยแพร่','投稿の保存、リアクション、コメント、投稿にはログインしてください。','登录后即可收藏帖子、互动、评论和发布内容。'],
    ['Saved community posts','โพสต์ชุมชนที่บันทึกไว้','保存したコミュニティ投稿','已保存的社区帖子'],
    ['Community cloud service is not configured.','ยังไม่ได้ตั้งค่าบริการคลาวด์ของชุมชน','コミュニティのクラウドサービスが設定されていません。','社区云服务尚未配置。'],
    ['Loading community posts…','กำลังโหลดโพสต์ชุมชน…','コミュニティ投稿を読み込み中…','正在加载社区帖子…'],
    ['Community setup is incomplete. Run turbo164-community-setup.sql in Supabase.','การตั้งค่าชุมชนยังไม่สมบูรณ์ โปรดเรียกใช้ turbo164-community-setup.sql ใน Supabase','コミュニティの設定が未完了です。Supabaseでturbo164-community-setup.sqlを実行してください。','社区设置尚未完成。请在 Supabase 中运行 turbo164-community-setup.sql。'],
    ['Log in to view your saved community posts.','เข้าสู่ระบบเพื่อดูโพสต์ชุมชนที่บันทึกไว้','ログインして保存したコミュニティ投稿を表示','登录后查看已保存的社区帖子。'],
    ['You have no saved community posts yet.','ยังไม่มีโพสต์ชุมชนที่บันทึกไว้','保存したコミュニティ投稿はまだありません。','您还没有保存社区帖子。'],
    ['No posts yet. Be the first to share something with the community.','ยังไม่มีโพสต์ เป็นคนแรกที่แบ่งปันกับชุมชน','まだ投稿はありません。最初にコミュニティで共有しましょう。','还没有帖子。来分享第一条社区动态吧。'],
    ['Text post','โพสต์ข้อความ','テキスト投稿','文字帖子'],
    ['Photo post','โพสต์รูปภาพ','写真投稿','图片帖子'],
    ['Video post','โพสต์วิดีโอ','動画投稿','视频帖子'],
    ['Share with the community','แบ่งปันกับชุมชน','コミュニティで共有','分享给社区'],
    ['Post type','ประเภทโพสต์','投稿タイプ','帖子类型'],
    ['Choose photo','เลือกรูปภาพ','写真を選択','选择照片'],
    ['Choose video','เลือกวิดีโอ','動画を選択','选择视频'],
    ['Share something with the community…','แบ่งปันบางอย่างกับชุมชน…','コミュニティで共有しましょう…','与社区分享一些内容…'],
    ['Add a caption (optional)…','เพิ่มคำบรรยาย (ไม่บังคับ)…','キャプションを追加（任意）…','添加说明（可选）…'],
    ['Allow others to save this post','อนุญาตให้ผู้อื่นบันทึกโพสต์นี้','他の人がこの投稿を保存できるようにする','允许他人保存此帖子'],
    ['Publish post','เผยแพร่โพสต์','投稿を公開','发布帖子'],
    ['Photos are resized before upload. Videos can be up to 80 MB.','รูปภาพจะถูกปรับขนาดก่อนอัปโหลด วิดีโอมีขนาดได้สูงสุด 80 MB','写真はアップロード前にサイズ変更されます。動画は最大80 MBです。','照片上传前会调整大小。视频最大 80 MB。'],
    ['Love','ถูกใจ','いいね','喜欢'],
    ['Save post','บันทึกโพสต์','投稿を保存','保存帖子'],
    ['Saved','บันทึกแล้ว','保存済み','已保存'],
    ['Saving disabled by author','เจ้าของปิดการบันทึก','投稿者が保存を無効にしています','作者已关闭保存'],
    ['Comments','ความคิดเห็น','コメント','评论'],
    ['Write a comment…','เขียนความคิดเห็น…','コメントを書く…','写评论…'],
    ['Post','โพสต์','投稿','发布'],
    ['Delete post','ลบโพสต์','投稿を削除','删除帖子'],
    ['Delete this post','ลบโพสต์นี้','この投稿を削除','删除此帖子'],
    ["Appearance","รูปลักษณ์","プロフィール設定","外观设置"],
    ["Username","ชื่อผู้ใช้","ユーザー名","用户名"],
    ["Show my username in Top Contributors","แสดงชื่อผู้ใช้ของฉันในรายชื่อผู้สนับสนุนสูงสุด","トップコントリビューターにユーザー名を表示","在最佳贡献者榜单显示我的用户名"],
    ["When off, your leaderboard entry appears as Anonymous contributor.","เมื่อปิด ชื่อของคุณจะแสดงเป็นผู้สนับสนุนไม่ระบุชื่อ","オフにするとランキングでは匿名の貢献者として表示されます。","关闭后，榜单将显示为匿名贡献者。"],
    ["Anonymous contributor","ผู้สนับสนุนไม่ระบุชื่อ","匿名の貢献者","匿名贡献者"],
    ["Profile picture","รูปโปรไฟล์","プロフィール画像","头像"],
    ["Profile picture preview","ตัวอย่างรูปโปรไฟล์","プロフィール画像のプレビュー","头像预览"],
    ["Remove picture","ลบรูป","画像を削除","移除图片"],
    ["Save appearance","บันทึกการตั้งค่า","設定を保存","保存设置"],
    ["My contribution points","คะแนนการมีส่วนร่วมของฉัน","自分の貢献ポイント","我的贡献积分"],
    ["Posts shared","โพสต์ที่แชร์","投稿数","已分享的帖子"],
    ["Approved model uploads","การส่งโมเดลที่ได้รับอนุมัติ","承認済みのモデル投稿","已批准的模型上传"],
    ["Each post and each approved model upload earns one point. Totals reset monthly at Bangkok time.","แต่ละโพสต์และการส่งโมเดลที่ได้รับอนุมัติได้อย่างละหนึ่งคะแนน คะแนนจะรีเซ็ตรายเดือนตามเวลากรุงเทพฯ","投稿または承認済みのモデル投稿ごとに1ポイント。ポイントはバンコク時間で毎月リセットされます。","每个帖子和每个获批的模型上传各计一分。积分按曼谷时间每月重置。"],
    ["Loading profile…","กำลังโหลดโปรไฟล์…","プロフィールを読み込み中…","正在加载个人资料…"],
    ["Saving profile…","กำลังบันทึกโปรไฟล์…","プロフィールを保存中…","正在保存个人资料…"],
    ["Profile saved.","บันทึกโปรไฟล์แล้ว","プロフィールを保存しました。","个人资料已保存。"],
    ["Loading contribution points…","กำลังโหลดคะแนน…","貢献ポイントを読み込み中…","正在加载贡献积分…"],
    ["Close","ปิด","閉じる","关闭"],
    ["Open your mini garage","เปิดโรงรถจิ๋วของคุณ","ミニガレージを開く","打开我的迷你车库"],
    ["Your mini garage","โรงรถจิ๋วของคุณ","マイミニガレージ","我的迷你车库"],
    ["Garage status","สถานะในโรงรถ","ガレージのステータス","车库状态"],
    ["No saved models in this list yet.","ยังไม่มีโมเดลที่บันทึกไว้ในรายการนี้","このリストにはまだモデルが保存されていません。","此列表中还没有已保存的模型。"],
    ["Log in to open your mini garage.","เข้าสู่ระบบเพื่อเปิดโรงรถจิ๋วของคุณ","ログインしてミニガレージを開きます。","登录后即可打开迷你车库。"],
    ['Top contributor history','ประวัติผู้สนับสนุนสูงสุด','トップコントリビューター履歴','最佳贡献者历史'],
    ['Archived monthly top five contributors.','บันทึกผู้สนับสนุน 5 อันดับแรกของแต่ละเดือน','月ごとのトップ5貢献者の記録です。','每月前五名贡献者的存档。'],
    ['Choose month','เลือกเดือน','月を選択','选择月份'],
    ['Loading history…','กำลังโหลดประวัติ…','履歴を読み込み中…','正在加载历史记录…'],
    ['No monthly history yet.','ยังไม่มีประวัติรายเดือน','月別履歴はまだありません。','暂无月度记录。'],
    ['Could not load contributor history:','ไม่สามารถโหลดประวัติผู้สนับสนุนได้:','貢献者履歴を読み込めませんでした:','无法加载贡献者历史记录：'],
    ['Top contributor','ผู้สนับสนุนสูงสุด','トップコントリビューター','最佳贡献者'],
    ['FYI: Points reset automatically at 12:00 AM GMT+7 on the first day of each month.','แจ้งให้ทราบ: คะแนนจะรีเซ็ตอัตโนมัติเวลา 00:00 น. GMT+7 ในวันแรกของทุกเดือน','お知らせ：ポイントは毎月1日午前0時（GMT+7）に自動リセットされます。','提示：积分将在每月1日 GMT+7 00:00 自动重置。'],
    ['Earn 1 point per community post and per approved car added to the catalogue this month.','รับ 1 คะแนนต่อโพสต์ในชุมชนและรถที่ได้รับอนุมัติเพิ่มในแค็ตตาล็อกในแต่ละเดือน','今月のコミュニティ投稿1件、カタログに承認追加された車1台につき1ポイント獲得できます。','本月每发布一条社区帖子或每辆获批加入目录的汽车可得 1 分。'],
    ['Post shared','โพสต์ที่แชร์','投稿数','分享帖子'],
    ['Car upload','รถที่เพิ่มในแค็ตตาล็อก','カタログ登録車','上传车型'],
    ['Points','คะแนน','ポイント','积分'],
    ['Loading contributors…','กำลังโหลดผู้สนับสนุน…','貢献者を読み込み中…','正在加载贡献者…'],
    ['No contributors yet.','ยังไม่มีผู้สนับสนุน','貢献者はまだいません。','暂无贡献者。'],
    ['Could not load contributors:','ไม่สามารถโหลดรายชื่อผู้สนับสนุนได้:','貢献者を読み込めませんでした:','无法加载贡献者：'],
    ['Rank','อันดับ','順位','排名'],
    ['Report data','ข้อมูลรายงาน','通報データ','举报数据'],
    ['Review pending reports','ตรวจสอบรายงานที่รอดำเนินการ','未対応の通報を確認','审核待处理举报'],
    ['Reported issues','รายการที่ถูกรายงาน','報告された内容','被举报事项'],
    ['Reported users','ผู้ใช้ที่ถูกรายงาน','報告されたユーザー','被举报用户'],
    ['Reported issue','รายการที่ถูกรายงาน','報告された内容','被举报事项'],
    ['Post from','โพสต์โดย','投稿者','帖子作者'],
    ['Reported by','รายงานโดย','報告者','举报人'],
    ['Report reason','เหตุผลในการรายงาน','通報理由','举报原因'],
    ['Status','สถานะ','ステータス','状态'],
    ['Open post','เปิดโพสต์','投稿を開く','打开帖子'],
    ['Post removed or unavailable','โพสต์ถูกลบหรือไม่พร้อมใช้งาน','投稿は削除済みまたは利用できません','帖子已删除或无法查看'],
    ['Posts reported','โพสต์ที่ถูกรายงาน','報告された投稿数','被举报帖子数'],
    ['Warnings given','จำนวนคำเตือนที่ให้','送信した警告数','已给予的警告数'],
    ['No reports yet.','ยังไม่มีรายงาน','報告はまだありません。','暂无举报记录。'],
    ['No reported users yet.','ยังไม่มีผู้ใช้ที่ถูกรายงาน','報告されたユーザーはいません。','暂无被举报用户。'],
    ['Warned','ได้รับคำเตือน','警告済み','已警告'],
    ['Removed','ถูกลบแล้ว','削除済み','已删除'],
    ['Rejected','ถูกปฏิเสธ','却下済み','已驳回'],
    ['Pending','รอดำเนินการ','保留中','待处理'],
    ['User email','อีเมลผู้ใช้','ユーザーのメールアドレス','用户邮箱'],
    ['Reports received','จำนวนรายงาน','受けた報告数','收到的举报数'],
    ['Warnings sent','จำนวนคำเตือนที่ส่ง','送信した警告数','已发送的警告数'],
    ['Loading report data…','กำลังโหลดข้อมูลรายงาน…','通報データを読み込み中…','正在加载举报数据…'],
    ['No report data yet.','ยังไม่มีข้อมูลรายงาน','通報データはまだありません。','暂无举报数据。'],
    ['Could not load report data:','ไม่สามารถโหลดข้อมูลรายงานได้:','通報データを読み込めませんでした:','无法加载举报数据：'],
    ['Email unavailable','ไม่พบอีเมล','メールアドレスを取得できません','无法获取邮箱'],
    ['Admin access required.','ต้องใช้สิทธิ์ผู้ดูแล','管理者権限が必要です','需要管理员权限'],
    ['Delete','ลบ','削除','删除'],
    ['Photo shared by','รูปภาพที่แบ่งปันโดย','写真の投稿者','分享照片的用户'],
    ['Your browser does not support embedded video.','เบราว์เซอร์ของคุณไม่รองรับวิดีโอที่ฝังไว้','このブラウザは埋め込み動画に対応していません。','您的浏览器不支持嵌入式视频。'],
    ['No comments yet.','ยังไม่มีความคิดเห็น','まだコメントはありません。','暂无评论。'],
    ['Write something before posting.','เขียนข้อความก่อนโพสต์','投稿する前に内容を入力してください。','发布前请先写点内容。'],
    ['Choose a photo or video for this post.','เลือกรูปภาพหรือวิดีโอสำหรับโพสต์นี้','この投稿の写真または動画を選択してください。','请为此帖子选择照片或视频。'],
    ['Choose an image file.','เลือกไฟล์รูปภาพ','画像ファイルを選択してください。','请选择图片文件。'],
    ['Choose an MP4, MOV, or WebM video under 80 MB.','เลือกวิดีโอ MP4, MOV หรือ WebM ที่มีขนาดต่ำกว่า 80 MB','80 MB未満のMP4、MOV、またはWebM動画を選択してください。','请选择小于 80 MB 的 MP4、MOV 或 WebM 视频。'],
    ['Publishing post…','กำลังเผยแพร่โพสต์…','投稿を公開中…','正在发布帖子…'],
    ['Post published.','เผยแพร่โพสต์แล้ว','投稿を公開しました。','帖子已发布。'],
    ['Could not publish post:','ไม่สามารถเผยแพร่โพสต์ได้:','投稿を公開できませんでした:','无法发布帖子：'],
    ['The owner has disabled saving for this post.','เจ้าของปิดการบันทึกโพสต์นี้','投稿者はこの投稿の保存を無効にしています。','作者已关闭此帖子的保存功能。'],
    ['Other people can now save this post.','ตอนนี้ผู้อื่นสามารถบันทึกโพสต์นี้ได้','他の人がこの投稿を保存できるようになりました。','其他人现在可以保存此帖子。'],
    ['Other people can no longer save this post.','ผู้อื่นไม่สามารถบันทึกโพสต์นี้ได้อีกต่อไป','他の人はこの投稿を保存できなくなりました。','其他人无法再保存此帖子。'],
    ['Delete this post and its comments, hearts and saves? This cannot be undone.','ลบโพสต์นี้พร้อมความคิดเห็น หัวใจ และรายการบันทึกใช่หรือไม่ การดำเนินการนี้ย้อนกลับไม่ได้','この投稿とコメント、いいね、保存を削除しますか？元に戻せません。','删除此帖子及其评论、爱心和收藏？此操作无法撤销。'],
    ['Post deleted.','ลบโพสต์แล้ว','投稿を削除しました。','帖子已删除。'],
    ['No comments yet.','ยังไม่มีความคิดเห็น','まだコメントはありません。','暂无评论。']
  );
  rows.push(
    ['← Back','← กลับ','← 戻る','← 返回'],
    ['Post options','ตัวเลือกโพสต์','投稿メニュー','帖子选项'],['Report post','รายงานโพสต์','投稿を報告','举报帖子'],['Report this post','รายงานโพสต์นี้','この投稿を報告','举报此帖子'],['Tell the admin why you are reporting this post.','แจ้งผู้ดูแลว่าเหตุใดคุณจึงรายงานโพสต์นี้','この投稿を報告する理由を管理者に伝えてください。','请告诉管理员举报此帖子的原因。'],['Describe the issue…','อธิบายปัญหา…','問題を説明してください…','请描述问题…'],['Send report','ส่งรายงาน','報告を送信','发送举报'],['Report sent to the admin for review.','ส่งรายงานให้ผู้ดูแลตรวจสอบแล้ว','報告を管理者に送信しました。','已将举报发送给管理员审核。'],['You already reported this post.','คุณรายงานโพสต์นี้ไปแล้ว','この投稿はすでに報告済みです。','您已举报过此帖子。'],['Please explain why you are reporting this post.','โปรดอธิบายเหตุผลที่รายงานโพสต์นี้','報告する理由を入力してください。','请说明举报此帖子的原因。'],['Log in to report posts in the community.','เข้าสู่ระบบเพื่อรายงานโพสต์ในชุมชน','コミュニティの投稿を報告するにはログインしてください。','登录后才能举报社区帖子。'],
    ['Community reports — Admin','รายงานชุมชน — ผู้ดูแล','コミュニティの報告 — 管理者','社区举报 — 管理员'],['↻ Refresh reports','↻ รีเฟรชรายงาน','↻ 報告を更新','↻ 刷新举报'],['Loading reports…','กำลังโหลดรายงาน…','報告を読み込み中…','正在加载举报…'],['Report queue unavailable:','ไม่สามารถเปิดคิวรายงานได้:','報告キューを利用できません:','举报队列不可用：'],['Pending community reports','รายงานชุมชนที่รอดำเนินการ','未対応のコミュニティ報告','待处理的社区举报'],['No pending community reports.','ไม่มีรายงานชุมชนที่รอดำเนินการ','未対応のコミュニティ報告はありません。','没有待处理的社区举报。'],['Post owner unavailable','ไม่พบเจ้าของโพสต์','投稿者を確認できません','无法获取帖子作者'],['Post unavailable','ไม่พบโพสต์','投稿を表示できません','帖子不可用'],['Reported content:','เนื้อหาที่ถูกรายงาน:','報告された投稿:','被举报内容：'],['No text content.','ไม่มีข้อความ','テキストはありません。','没有文字内容。'],['Report reason:','เหตุผลที่รายงาน:','報告理由:','举报原因：'],['Warn owner','เตือนเจ้าของโพสต์','投稿者に警告','警告作者'],['Remove post','ลบโพสต์','投稿を削除','删除帖子'],['Reject report','ปฏิเสธรายงาน','報告を却下','驳回举报'],['Remove this reported post? This also deletes its comments, hearts, and saves.','ลบโพสต์ที่ถูกรายงานนี้หรือไม่ ความคิดเห็น หัวใจ และรายการบันทึกจะถูกลบด้วย','報告された投稿を削除しますか？コメント、いいね、保存も削除されます。','确定删除被举报的帖子吗？其评论、爱心和收藏也会一并删除。'],['Post removed.','ลบโพสต์แล้ว','投稿を削除しました。','帖子已删除。'],['Report rejected; the post remains unchanged.','ปฏิเสธรายงานแล้ว โดยโพสต์ยังคงอยู่เหมือนเดิม','報告を却下しました。投稿はそのまま残ります。','已驳回举报，帖子保持不变。'],['Warn post owner','เตือนเจ้าของโพสต์','投稿者に警告する','警告帖子作者'],['Write a private warning that will appear in the owner’s Community page.','เขียนคำเตือนส่วนตัวซึ่งจะแสดงในหน้าชุมชนของเจ้าของโพสต์','投稿者のコミュニティページに表示する非公開の警告を入力してください。','填写一条私密警告，将显示在帖子作者的社区页面。'],['Write the warning…','เขียนคำเตือน…','警告内容を入力…','填写警告内容…'],['Send warning','ส่งคำเตือน','警告を送信','发送警告'],['Warning sent to the post owner.','ส่งคำเตือนถึงเจ้าของโพสต์แล้ว','投稿者に警告を送信しました。','已向帖子作者发送警告。'],['Community notice','ประกาศจากชุมชน','コミュニティからのお知らせ','社区通知'],['Dismiss notice','ปิดประกาศ','通知を閉じる','关闭通知'],['Choose photos (up to 6)','เลือกรูปภาพ (สูงสุด 6 รูป)','写真を選択（最大6枚）','选择照片（最多 6 张）'],['Choose up to 6 photos for one post.','เลือกได้สูงสุด 6 รูปต่อโพสต์','1つの投稿につき写真は最大6枚まで選択できます。','每条帖子最多选择 6 张照片。'],['Choose image files only.','เลือกเฉพาะไฟล์รูปภาพ','画像ファイルのみ選択してください。','只能选择图片文件。'],['Choose one MP4, MOV, or WebM video under 80 MB.','เลือกวิดีโอ MP4, MOV หรือ WebM เพียงหนึ่งไฟล์ที่มีขนาดไม่เกิน 80 MB','80 MB以下のMP4、MOV、またはWebM動画を1本選択してください。','请选择一个小于 80 MB 的 MP4、MOV 或 WebM 视频。'],['photos selected','รูปที่เลือก','枚選択済み','张已选择']
  );
  const dictionaries={th:{},ja:{},zh:{}};
  rows.forEach(([en,th,ja,zh])=>{dictionaries.th[en]=th;dictionaries.ja[en]=ja;dictionaries.zh[en]=zh;});
  const langStore='turbo164-language-v1';
  const supported=['en','th','ja','zh'];
  const textState=new WeakMap(),attrState=new WeakMap();
  let language=localStorage.getItem(langStore)||'en';
  if(!supported.includes(language))language='en';
  function preserveSpace(source,translated){const lead=(source.match(/^\s*/)||[''])[0],tail=(source.match(/\s*$/)||[''])[0];return lead+translated+tail;}
  function lookup(raw,lang=language){
    const clean=String(raw??'').trim();if(!clean||lang==='en')return clean;
    const dict=dictionaries[lang];if(dict[clean])return dict[clean];
    let match=clean.match(/^All (.+) models$/);if(match)return ({th:`รุ่นทั้งหมดของ ${match[1]}`,ja:`${match[1]}の全モデル`,zh:`所有 ${match[1]} 车型`})[lang];
    match=clean.match(/^(.+) · (.+) catalogue$/);if(match)return `${match[1]} · ${dict.catalogue}`;
    match=clean.match(/^(.+) diecast catalogue$/);if(match)return `${dict[match[1]]||match[1]} · ${lang==='th'?'รถไดแคสต์':lang==='ja'?'ミニカー': '合金车'} ${dict.catalogue}`;
    match=clean.match(/^(\d+) models$/);if(match)return ({th:`${match[1]} รุ่น`,ja:`${match[1]} モデル`,zh:`${match[1]} 个车型`})[lang];
    match=clean.match(/^(\d+) possible releases?$/);if(match)return ({th:`${match[1]} รุ่นที่อาจตรงกัน`,ja:`候補製品 ${match[1]} 件`,zh:`${match[1]} 个可能款式`})[lang];
    let dynamic=clean.match(/^Reading (visible car|package) text locally · pass (\d+) of 3…$/);
    if(dynamic){const templates={th:dynamic[1]==='visible car'?['กำลังอ่านข้อความบนรถในอุปกรณ์ · รอบที่ ',' จาก 3…']:['กำลังอ่านข้อความบนแพ็กเกจในอุปกรณ์ · รอบที่ ',' จาก 3…'],ja:dynamic[1]==='visible car'?['車体の文字を端末内で読取中 · ',' / 3…']:['パッケージの文字を端末内で読取中 · ',' / 3…'],zh:dynamic[1]==='visible car'?['正在本地读取车身文字 · 第 ',' / 3…']:['正在本地读取包装文字 · 第 ',' / 3…']}[lang];return templates[0]+dynamic[2]+templates[1]}
    const prefixes={
      'Signed in: ':{th:'เข้าสู่ระบบแล้ว: ',ja:'ログイン中: ',zh:'已登录：'},
      'Editing the shared card: ':{th:'กำลังแก้ไขการ์ดที่แชร์: ',ja:'共有カードを編集中: ',zh:'正在编辑共享卡片：'},
      'Could not upload replacement photo: ':{th:'อัปโหลดรูปภาพทดแทนไม่สำเร็จ: ',ja:'差し替え写真をアップロードできませんでした: ',zh:'无法上传替换照片：'},
      'Could not save item: ':{th:'บันทึกรายการไม่สำเร็จ: ',ja:'項目を保存できませんでした: ',zh:'无法保存项目：'},
      'Refresh failed: ':{th:'รีเฟรชไม่สำเร็จ: ',ja:'更新に失敗しました: ',zh:'刷新失败：'},
      'Review queue unavailable: ':{th:'ไม่สามารถเปิดคิวตรวจสอบได้: ',ja:'審査キューを利用できません: ',zh:'审核队列不可用：'},
      'Photo submitted for review. It will not appear publicly until approved.':{th:'ส่งรูปภาพเพื่อตรวจสอบแล้ว รูปจะไม่ปรากฏต่อสาธารณะจนกว่าจะอนุมัติ',ja:'写真を審査に送信しました。承認されるまで公開されません。',zh:'照片已提交审核，获批前不会公开。'}
    };
    for(const [prefix,translations] of Object.entries(prefixes))if(clean.startsWith(prefix))return translations[lang]+clean.slice(prefix.length);
    dynamic=clean.match(/^Uploading photograph (\d+) of (\d+)(…?)$/);
    if(dynamic){const templates={th:['กำลังอัปโหลดรูปที่ ',' จาก ','…'],ja:['写真をアップロード中 ',' / ','…'],zh:['正在上传照片 ',' / ','…']}[lang];return templates[0]+dynamic[1]+templates[1]+dynamic[2]+templates[2]}
    dynamic=clean.match(/^(Visual lookalikes · |Related vehicle releases · )?(\d+) possible releases? (across manufacturers|for .+?) · not guaranteed identifications$/);
    if(dynamic){const lead=dynamic[1]?.startsWith('Visual')?{th:'ภาพที่คล้ายกัน · ',ja:'見た目が似た候補 · ',zh:'外观相似项 · '}[lang]:dynamic[1]?{th:'รุ่นรถที่เกี่ยวข้อง · ',ja:'関連する車種の製品 · ',zh:'相关车型款式 · '}[lang]:'';const count={th:`${dynamic[2]} รุ่นที่อาจตรงกัน`,ja:`候補製品 ${dynamic[2]} 件`,zh:`${dynamic[2]} 个可能款式`}[lang];const scope=dynamic[3]==='across manufacturers'?{th:'จากผู้ผลิตทั้งหมด',ja:'全メーカー',zh:'所有制造商'}[lang]:dynamic[3].replace(/^for /,'');return `${lead}${count} ${scope} · `+{th:'ไม่รับประกันการระบุ',ja:'特定を保証するものではありません',zh:'不保证识别准确'}[lang]}
    return clean;
  }
  function translateNode(node){
    if(node.parentElement?.closest('[data-no-i18n]'))return;
    const current=node.nodeValue;if(!current.trim())return;const previous=textState.get(node);
    const source=previous&&current===previous.applied?previous.source:current;
    const translated=preserveSpace(source,lookup(source));
    textState.set(node,{source,applied:translated});
    if(current!==translated)node.nodeValue=translated;
  }
  const attrs=['placeholder','title','aria-label','alt'];
  function translateElement(el){
    if(el.closest?.('[data-no-i18n]'))return;
    let state=attrState.get(el);if(!state){state={};attrState.set(el,state)}
    for(const attr of attrs){if(!el.hasAttribute(attr))continue;const current=el.getAttribute(attr),previous=state[attr];const source=previous&&current===previous.applied?previous.source:current;const translated=lookup(source);state[attr]={source,applied:translated};if(current!==translated)el.setAttribute(attr,translated);}
  }
  function apply(root=document.body){
    if(!root)return;
    if(root.nodeType===Node.TEXT_NODE){translateNode(root);return;}
    if(root.nodeType===Node.ELEMENT_NODE)translateElement(root);
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;while((node=walker.nextNode()))translateNode(node);
    if(root.querySelectorAll)root.querySelectorAll('*').forEach(translateElement);
  }
  function setLanguage(next){
    if(!supported.includes(next))return;language=next;try{localStorage.setItem(langStore,next)}catch{}document.documentElement.lang=next;apply();
    const select=document.getElementById('languageSelect');if(select)select.value=next;
    window.dispatchEvent(new CustomEvent('turbo164:languagechange',{detail:{language:next}}));
  }
  window.T164I18N={get language(){return language;},translate:lookup,setLanguage,apply};
  document.documentElement.lang=language;
  const select=document.getElementById('languageSelect');if(select){select.value=language;select.addEventListener('change',()=>setLanguage(select.value));}
  const languageToggle=document.getElementById('languageToggle'),languageMenu=document.getElementById('languageMenu');
  function updateLanguageMenu(){if(!languageMenu)return;languageMenu.querySelectorAll('[data-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.language===language)));}
  if(languageToggle&&languageMenu){languageToggle.addEventListener('click',()=>{const opening=languageMenu.hidden;languageMenu.hidden=!opening;languageToggle.setAttribute('aria-expanded',String(opening));});languageMenu.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>{setLanguage(button.dataset.language);languageMenu.hidden=true;languageToggle.setAttribute('aria-expanded','false');}));document.addEventListener('click',event=>{if(!event.target.closest('#languagePicker')){languageMenu.hidden=true;languageToggle.setAttribute('aria-expanded','false');}});window.addEventListener('turbo164:languagechange',updateLanguageMenu);updateLanguageMenu();}
  apply();
  new MutationObserver(records=>records.forEach(record=>{
    if(record.type==='characterData')translateNode(record.target);
    else if(record.type==='attributes')translateElement(record.target);
    else record.addedNodes.forEach(node=>apply(node));
  })).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attrs});
})();
