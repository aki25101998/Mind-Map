# Hiến pháp (Agent Constitution)

## Quy tắc Tự động Cập nhật GitHub và Deploy Firebase (Auto-Push & Deploy Rule)

**Mô tả:** Người dùng đã yêu cầu bạn luôn tự động upload code lên GitHub và deploy lên Firebase.
 
Bất cứ khi nào bạn hoàn thành một tác vụ lập trình, sửa lỗi, hoặc thay đổi bất kỳ file code nào trong dự án này, bạn **BẮT BUỘC** phải tự động commit, push các thay đổi đó lên GitHub và deploy dự án lên Firebase trước khi kết thúc câu trả lời của mình.

### Quy trình thực hiện (Workflow):
1. **Kiểm tra trạng thái:** `git status`
2. **Thêm các thay đổi:** `git add .`
3. **Commit:** `git commit -m "Mô tả ngắn gọn, rõ ràng về thay đổi vừa thực hiện"`
4. **Push lên GitHub:** `git push`
5. **Build dự án:** `cmd.exe /c npm run build`
6. **Deploy lên Firebase:** `cmd.exe /c npx -p firebase-tools firebase deploy`

*Mẹo: Trên PowerShell, để chạy chuỗi các lệnh này, hãy dùng dấu `;`. Ví dụ:*
`git add . ; git commit -m "update" ; git push ; cmd.exe /c npm run build ; cmd.exe /c npx -p firebase-tools firebase deploy`

**LƯU Ý QUAN TRỌNG:** 
- Đừng chờ người dùng nhắc nhở hay ra lệnh push code hay deploy.
- Hãy tự động chạy các lệnh này thông qua công cụ `run_command` của bạn ngay khi code xong.
