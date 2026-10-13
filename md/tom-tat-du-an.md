# WEWIN AI History Lab — tóm tắt dự án

WEWIN AI History Lab là studio web cho giáo viên. Giáo viên đưa tư liệu lịch sử đã kiểm chứng vào, hệ thống tạo một bài giảng song ngữ Việt–Anh, rồi cho sửa, trình chiếu và tải xuống. Một lần bấm **Tạo slide** sinh cùng lúc năm phần của cùng một bài: Bài học AI, Knowledge Graph, Time Travel, AI vs History và Learning Analytics.

Ảnh do giáo viên đặt. Hệ thống không dùng AI Vision và không OCR.

## Công nghệ

| Lớp | Công nghệ |
| --- | --- |
| Ứng dụng | Next.js 16.3 (App Router, Turbopack khi dev), React 19, TypeScript |
| Giao diện | Tailwind CSS 4, CSS trong `src/app/globals.css` |
| Dữ liệu | PostgreSQL, Prisma 7 (`prisma db push`), client sinh ra tại `src/generated/prisma`, kết nối qua `@prisma/adapter-pg` |
| Xác thực | Cookie `wewin_session` (httpOnly, 7 ngày), mật khẩu băm bằng scrypt |
| AI | Một lần gọi chat. Ưu tiên OpenAI (`MODEL`, mặc định `gpt-5-nano`, `reasoning_effort` là `low`). Nếu không có khóa OpenAI thì dùng Anthropic. Nếu không có khóa nào thì chia tư liệu cục bộ, không gọi model |
| Đọc tư liệu | `pdf-parse` (PDF có lớp chữ), `mammoth` (Word .docx), TXT, HTML từ link http/https |
| Xuất file | PDF bằng `pdf-lib` trên server; PowerPoint bằng `pptxgenjs` trên trình duyệt |
| Triển khai | Vercel, build `prisma generate && next build`. Biến môi trường: `DATABASE_URL`, `OPENAI_API_KEY`, `MODEL` |

## Đường đi của người dùng

1. Chưa đăng nhập thì thấy form đăng nhập. Hai vai: `USER` (chỉ bài của mình) và `ADMIN` (mọi bài). Trang Quản trị hiện chỉ là lời nhắc; việc mở và lưu mọi thiết kế nằm ở màn hình bắt đầu.
2. Sau đăng nhập là thư viện thiết kế. Thẻ mới mở studio trống. Mỗi bài đã lưu là một thẻ, hiện tiêu đề và lần cập nhật.
3. Studio có thanh tệp (Mới, Mở, Lưu, Tải xuống, Trình chiếu), năm tab, form tạo bài bên trái và vùng xem bên phải.
4. Trong lúc chờ AI, vùng slide hiện vòng xoay. Nút Tạo slide bị khóa đến khi xong.

## Form tạo bài

Form tên **Tạo trải nghiệm lịch sử**:

- Chủ đề, bắt buộc.
- Tư liệu: dán chữ, tối đa 8 file (PDF có chữ, Word, TXT, ảnh png/jpg/jpeg/webp), hoặc nhiều link http/https (tối đa 6).
- Khối lớp Grade 4–9, mặc định Grade 5.
- CEFR A1–B2, mặc định A2.
- Teaching Mode: Storytelling, Time Travel, History Detective, Role Play. Mode chỉ đi vào lời nhắc, không đổi năm tab.
- Số slide 3–30, mặc định 10.
- Thời lượng 5–180 phút, mặc định 40. Thời lượng cũng chỉ đi vào lời nhắc.
- Template: AI chọn layout, hoặc một layout cố định cho các slide giữa.
- Ghi chú tự do.

Khối lớp, CEFR, mode, thời lượng và template áp dụng cho lần **Tạo slide** kế tiếp, không tự viết lại bài đang mở.

## Tư liệu và một lần gọi AI

Chữ dán, chữ trong file và chữ lấy từ website được nối lại, trần 100.000 ký tự. Link nội bộ và địa chỉ riêng bị bỏ. PDF scan (gần như không có lớp chữ) thì dừng và báo bản này chưa OCR. Ảnh đính kèm không được đọc; nếu gần như chỉ có ảnh, hệ thống nhắc giáo viên dán phần chữ. Ảnh đầu tiên được gắn lên slide đầu. Các ảnh sau giáo viên tự đặt.

Toàn bộ tư liệu đi trong một lời nhắc. Không cắt đầu–giữa–cuối. Với OpenAI, ngân sách token là 16.000, hoặc 32.000 khi tư liệu dài hơn 12.000 ký tự hoặc số slide lớn hơn 15. Ô dán dài hơn 12.000 ký tự mà model trả về rỗng, hết độ dài hoặc lỗi ngữ cảnh thì hiện: *Ô Dán tư liệu đã kiểm chứng có quá nhiều chữ nên không tạo được bài.*

Model chỉ được điền chữ vào layout có sẵn, chỉ dùng dữ kiện trong tư liệu, và viết tiếng Anh theo CEFR đã chọn. Tên riêng giữ tiếng Việt. Nếu số slide trả về lệch yêu cầu, hệ thống cắt hoặc thêm slide tổng kết cho đủ số và ghi cảnh báo. Từ 20 slide trở lên có cảnh báo thời gian và chi phí. Nếu chưa lưu được database, bài vẫn xem và sửa trong phiên đó.

## Năm tab

**Bài học AI.** Bộ slide song ngữ. Công tắc VI / VI + EN / EN cũng điều khiển Time Travel và AI vs History. Thanh trang có Sửa trang và bước ‹ n / tổng ›. Phía dưới là dải trang kiểu film: ảnh thu nhỏ đúng nội dung slide, trang đang chọn viền tím, menu nhân bản hoặc xóa, nút thêm trang trống. Sửa trang cho đổi tiêu đề, thân bài, layout, thứ tự, thêm hoặc xóa slide. Trắc nghiệm khóa sau khi chọn và tô đáp án đúng hoặc sai.

**Knowledge Graph.** Các nút (nhân vật, sự kiện, thời gian, địa điểm, nguyên nhân, quyết định, hệ quả) và cạnh nối, lấy từ cùng một lần tạo bài.

**Time Travel.** Một cảnh quyết định: bối cảnh, câu hỏi, ít nhất hai lựa chọn, mỗi lựa chọn có cờ lịch sử và hệ quả song ngữ.

**AI vs History.** Câu nhận định. Người học phân loại fact, interpretation hoặc unsupported, rồi xem giải thích.

**Learning Analytics.** Cố ý để trống, dòng *Chưa có dữ liệu học tập.* Chưa thu dữ liệu học tập.

Sau khi tạo xong, studio mở tab Knowledge Graph.

## Mười hai layout slide

`title`, `objectives`, `context`, `timeline`, `map`, `character`, `comparison`, `cause-effect`, `quote`, `vocab`, `quiz`, `summary`.

Id lạ được đưa về layout gần nhất; không đoán được thì dùng `context`. Slide đầu nên là mở đầu, slide cuối nên là tổng kết. Khi không có API và template để tự động, các slide giữa xoay vòng layout. Template cụ thể là ưu tiên cho các slide giữa.

Trên slide, nhãn layout khoảng 33 pt, ý chính khoảng 26 pt, tiếng Anh nằm trong khung phụ khoảng 20 pt. Nội dung căn trái và trải theo chiều ngang slide, lề khoảng 38 px. Đoạn văn dài được tách thành tối đa ba ý. Khi trình chiếu, ảnh trong khung chân dung hoặc bản đồ được thu để nhìn đủ hình, không tràn khỏi trang.

Mỗi phần tử có chuyển động rise; cả slide fade khi sang trang. `prefers-reduced-motion` thì tắt chuyển động.

## Trình chiếu và tải xuống

Trình chiếu (nút hoặc F5) theo đúng tab đang mở. Trong bài học: mũi tên trái/phải đổi slide, click trái sang sau, click phải về trước, Escape thoát. PDF và PowerPoint cũng theo tab đang mở.

PDF do server dựng, nền xanh, mỗi slide một trang. PowerPoint là file `WEWIN-AI-History-Lab.pptx`, khổ rộng, dựng trên máy người dùng.

## Dữ liệu

Bài giảng là `Lesson`: chủ đề, khối, CEFR, mode, thời lượng, số slide, template, ghi chú, tiêu đề song ngữ, cảnh báo, graph, mission, AI vs History, tư liệu đã trích, và chủ sở hữu.

Mỗi trang là `LessonSlide`: thứ tự, layout, loại, animation, transition, tiêu đề và thân bài song ngữ, từ vựng, câu hỏi, lựa chọn, ảnh và tọa độ ảnh.

`Deck` và `Slide` vẫn còn trong schema, không phải mô hình studio đang dùng.

## API chính

| Đường dẫn | Việc làm |
| --- | --- |
| `POST /api/auth/login`, `POST /api/auth/logout` | Đăng nhập, đăng xuất |
| `GET/POST /api/lessons`, `GET/PATCH /api/lessons/:id` | Danh sách, tạo, mở, lưu bài |
| `POST /api/generate` | Trích tư liệu, gọi AI một lần, lưu bài |
| `POST /api/media` | Tải ảnh giáo viên đặt, tối đa 8 MB, lưu `public/uploads` |
| `POST /api/export/pdf` | Xuất PDF của tab đang mở |
| `GET /api/health` | Kiểm tra dịch vụ |

Mọi đường dẫn trên, trừ health, yêu cầu đã đăng nhập.
