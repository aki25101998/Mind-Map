# Hiến pháp (Agent Constitution)

## Quy tắc Tự động Cập nhật GitHub (GitHub Auto-Push Rule)

**Mô tả:** Người dùng đã yêu cầu bạn luôn tự động upload code lên GitHub.
 
Bất cứ khi nào bạn hoàn thành một tác vụ lập trình, sửa lỗi, hoặc thay đổi bất kỳ file code nào trong dự án này, bạn **BẮT BUỘC** phải tự động commit và push các thay đổi đó lên GitHub trước khi kết thúc câu trả lời của mình.

### Quy trình thực hiện (Workflow):
1. **Kiểm tra trạng thái:** `git status`
2. **Thêm các thay đổi:** `git add .`
3. **Commit:** `git commit -m "Mô tả ngắn gọn, rõ ràng về thay đổi vừa thực hiện"`
4. **Push:** `git push`

**LƯU Ý QUAN TRỌNG:** 
- Đừng chờ người dùng nhắc nhở hay ra lệnh push code.
- Hãy tự động chạy các lệnh git này thông qua công cụ `run_command` của bạn ngay khi code xong.
