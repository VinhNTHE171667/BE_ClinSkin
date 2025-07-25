# Lấy endpoint stripe:
- truy cập https://dashboard.ngrok.com và chạy ngrok config add-authtoken <YOUR_AUTHTOKEN> trong cmd
- chạy ngrok: ngrok http 9999
- truy cập stripe dashboard
- click mục developer mở popup rồi click vào webhook để tạo destination (trong này chọn checkout.session.completed và checkout.session.expired)
- lấy link https gắn vào Endpoint URL rồi create Destination
- hoàn tất thì màn dashboard sẽ có end point secret: whsec_......