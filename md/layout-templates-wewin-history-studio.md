# Bộ layout template cố định — WEWIN AI History Lab

## 1. Mục tiêu

Mỗi phần của bài giảng có các template giao diện dựng sẵn. API chỉ cung cấp nội dung có cấu trúc và `layout_id`; frontend chọn component template tương ứng rồi đổ dữ liệu vào đúng vùng. AI không tạo HTML/CSS, không tự quyết định cách sắp xếp giao diện và không thay đổi cấu trúc layout.

Quy tắc chọn mẫu:

1. Giáo viên chọn template chung trong form hoặc chọn template riêng cho từng slide.
2. Frontend gửi `template_id` lên API.
3. Backend/AI trả nội dung theo schema của template đó và giữ nguyên `layout_id` đã chọn.
4. Frontend render component gắn với `layout_id`. Nếu thiếu hoặc không hợp lệ, dùng mẫu dự phòng do frontend quy định.
5. Giáo viên có thể đổi layout của slide trong chế độ sửa; frontend đổi component, nội dung không bị mất.

`layout_id` là mã ổn định trong code, không dùng tên do AI tự viết. Những nội dung văn bản và lựa chọn vẫn do API cung cấp; bố cục là template cố định.

## 2. Ngôn ngữ thiết kế dùng chung

- Phong cách: lớp học lịch sử hiện đại, dễ đọc, cảm giác tư liệu được kiểm chứng.
- Màu nền: giấy sáng `#F7F5EF`; chữ chính `#192B3A`; xanh lịch sử `#1F5E64`; vàng nhấn `#D5A447`; đỏ cảnh báo `#A9433E`.
- Khung nội dung bo góc 12–16 px, viền mảnh; đổ bóng nhẹ, tránh hiệu ứng gây nhiễu.
- Mỗi slide có vùng tiêu đề, vùng nội dung, chân trang gồm số slide và nguồn. Chiều cao vùng nội dung co giãn; nếu chữ dài, cuộn hoặc rút gọn theo quy tắc sản phẩm, không làm vỡ khung.
- Ảnh chỉ hiện khi có `image_url` do giáo viên tải lên/chọn. Không tự tìm ảnh, không suy luận nội dung ảnh.
- Mọi template bài học hỗ trợ VI / VI+EN / EN.

## 3. Bài học AI — 12 template slide

Tất cả template bên dưới dùng cùng khung ngoài: nhãn loại layout, số slide, tiêu đề Việt/Anh theo công tắc ngôn ngữ và nội dung. Không có ghi chú giảng dạy và không có khối câu trích khóa nguồn ở chân slide.

| `layout_id` | Tên hiển thị | Bố cục cố định và vùng dữ liệu |
|---|---|---|
| `title` | Mở đầu | Tiêu đề lớn ở trái; dòng phụ là chủ đề/niên đại; ảnh tùy chọn chiếm nửa phải; dải dưới có lớp, thời lượng và câu dẫn nhập. |
| `objectives` | Mục tiêu học tập | Tiêu đề trên; 3 thẻ mục tiêu dạng danh sách, mỗi thẻ có số thứ tự, câu mục tiêu và biểu tượng cố định; không có mục tiêu thì ẩn thẻ thừa. |
| `context` | Bối cảnh | Cột trái là đoạn bối cảnh; cột phải là hộp “Cần biết trước” với tối đa 3 ý; ảnh nhỏ tùy chọn nằm dưới hộp phụ. |
| `timeline` | Dòng thời gian | Trục ngang tối đa 4 mốc lấy từ `timeline_items[]`; mỗi mốc có ngày/nhãn và mô tả ngắn. Không tự chia `body_vi` theo dấu câu; API phải trả danh sách mốc riêng. |
| `map` | Bản đồ / địa điểm | Khung hình lớn bên trái nhận `image_url` của bản đồ do giáo viên cung cấp; bên phải là địa điểm, mô tả và tối đa 3 chú thích. Không có ảnh thì hiện khung placeholder ghi “Chưa có bản đồ”. |
| `character` | Nhân vật | Thẻ chân dung/ảnh tùy chọn ở trái; bên phải là tên, vai trò, hành động/quyết định và ý nghĩa. Các trường tách riêng, không gộp cùng một đoạn văn. |
| `comparison` | So sánh | Hai cột A/B có nhãn riêng, mỗi cột chứa các ý `points[]`; phần cuối là kết luận chung. Không lặp một đoạn nội dung ở cả hai cột. |
| `cause-effect` | Nguyên nhân – diễn biến – kết quả | Ba thẻ nối bằng mũi tên: `causes[]` → `developments[]` → `consequences[]`; dùng nhãn tiếng Việt/Anh cố định theo ngôn ngữ đang chọn. |
| `quote` | Trích dẫn tư liệu | Thân bài chữ lớn trong khung trích dẫn. Không có chữ thì khung báo chưa có nội dung. Không tạo trường câu trích riêng. |
| `vocab` | Từ vựng | Lưới tối đa 6 thẻ; mỗi thẻ gồm từ tiếng Anh, nghĩa tiếng Việt và câu ví dụ ngắn lấy từ nội dung bài; có thể phát âm về sau nhưng không nằm trong template hiện tại. |
| `quiz` | Câu hỏi nhanh | Câu hỏi nổi bật phía trên; 2–4 lựa chọn dạng nút; sau khi chọn khóa đáp án, đánh dấu đúng/sai và hiện phản hồi song ngữ. Nếu thiếu đáp án, không hiển thị trạng thái đúng/sai. |
| `summary` | Tổng kết | Một câu kết luận lớn; bên dưới tối đa 3 ý cần nhớ; dải cuối là câu hỏi suy ngẫm hoặc nhiệm vụ tiếp theo nếu API cung cấp. |

### Thứ tự vùng chung trong slide

1. Header: tên bài, nhãn layout, số slide.
2. Title: `title_vi`, `title_en`.
3. Body: component của đúng `layout_id`.
4. Tương tác: quiz chỉ có ở `quiz`; không tự chèn vào layout khác.
5. Điều hướng trước/sau nằm ngoài slide. Slide không có chân câu nguồn.

## 4. Knowledge Graph — 3 template màn hình

| `layout_id` | Bố cục |
|---|---|
| `graph.radial` | Nút trung tâm là chủ đề/sự kiện; các Person, Time, Place, Cause, Consequence, Decision xếp quanh theo vòng tròn. Cạnh có mũi tên và nhãn quan hệ. Đây là mặc định. |
| `graph.swimlane` | Các làn ngang cố định theo loại: Thời gian, Nhân vật, Địa điểm, Nguyên nhân/Kết quả. Nút nằm trong làn tương ứng; cạnh biểu diễn quan hệ liên làn. |
| `graph.network` | Đồ thị tự do trong vùng giới hạn, dùng vị trí node từ thuật toán frontend dựa trên dữ liệu; không dùng tọa độ do AI sinh. Có bộ lọc loại nút và panel chi tiết khi chọn node. |

Schema hiển thị: `nodes[{id,label,type}]`, `edges[{from,to,label}]`. Template nào cũng phải vẽ nhãn cạnh, có trạng thái rỗng, và cho phép nhấn nút để xem chi tiết. Bố cục đồ thị được tính ở frontend; AI chỉ trả node/edge có căn cứ. Không trả câu trích trên nút hay cạnh.

## 5. Time Travel — 3 template hoạt động

| `layout_id` | Bố cục |
|---|---|
| `mission.decision` | Cảnh lịch sử ở đầu; câu hỏi quyết định ở giữa; 2–4 lựa chọn dạng thẻ lớn; chọn xong mở hệ quả. Mặc định. |
| `mission.evidence-hunt` | Cột trái là nhiệm vụ/tuyên bố cần kiểm chứng; cột phải là các mảnh nội dung trong tư liệu; học sinh chọn mảnh phù hợp rồi xem giải thích. |
| `mission.chapter-path` | Sơ đồ 3 chặng đánh số; mỗi chặng có cảnh, câu hỏi và trạng thái khóa/mở. Có thể dùng khi API trả nhiều chặng; nếu chỉ có một chặng thì không chọn mẫu này. |

Schema chung: `scene`, `question`, `choices[]` hoặc `stages[]`; mỗi lựa chọn/chặng chứa chữ VI/EN, hệ quả và cờ `historical`. Frontend không tự gán nhãn “đúng lịch sử” bằng màu; chỉ hiển thị phản hồi do dữ liệu trả về. Không trả `source_quote`.

## 6. AI vs History — 3 template thử thách

| `layout_id` | Bố cục |
|---|---|
| `challenge.classify` | Một claim ở trung tâm; ba nút FACT / INTERPRETATION / UNSUPPORTED; sau khi trả lời hiện giải thích. Mặc định. |
| `challenge.fact-check` | Claim lớn ở trái; cột phải là lựa chọn “Được hỗ trợ / Không đủ chứng cứ”; sau đó hiện phân loại chuẩn và giải thích. |
| `challenge.claim-cards` | Danh sách claim dạng thẻ, mỗi thẻ có trạng thái chưa làm/đã làm; nhấn thẻ mở phần phân loại và giải thích. Dùng khi có nhiều claim. |

Schema: `items[{claim_vi,claim_en,answer,explanation_vi,explanation_en}]`. Không chỉ render phần tử đầu tiên nếu API trả nhiều mục. Không trả câu trích hay cờ đối chiếu nguồn.

## 7. Learning Analytics — 3 template báo cáo

| `layout_id` | Bố cục |
|---|---|
| `analytics.class-overview` | 4 thẻ KPI phía trên; biểu đồ tiến bộ theo nhóm năng lực; bảng số học sinh hoàn thành/chưa hoàn thành; insight giáo viên phía dưới. Mặc định khi có dữ liệu lớp. |
| `analytics.student-progress` | Bộ chọn học sinh; đường tiến bộ theo thời gian; các chỉ số kiến thức, từ vựng, lập luận, tham gia; gợi ý cá nhân. |
| `analytics.pilot-preview` | Khi chưa có dữ liệu thực: vùng demo có nhãn nổi bật “Dữ liệu minh họa”; hiển thị KPI mẫu và mô tả cách đo, không trình bày số giả như kết quả thật. |

Schema: `data_status` (`real`, `sample`, `empty`), `metrics[]` (value, unit, label, period, sample_flag), `series[]`, `insight`, `completion`. Nếu `data_status` là `empty`, hiện hướng dẫn kết nối dữ liệu học sinh, không vẽ KPI. Nút “Tạo hoạt động tiếp theo” chỉ bật khi đã có endpoint và payload hợp lệ.

## 8. Template picker trong giao diện

- Form tạo bài: lựa chọn “Tự chọn theo nội dung” được đổi thành “Dùng bộ template mặc định”; bên dưới cho chọn một layout cụ thể cho các slide giữa hoặc để hệ thống luân phiên theo quy tắc cố định.
- Có thể bật “Chọn layout cho từng slide” để chọn `layout_id` trước khi gọi API.
- Nếu không chọn riêng: slide đầu `title`, slide cuối `summary`; phần giữa luân phiên `context`, `timeline`, `character`, `cause-effect`, `quote`, `vocab`, `quiz` theo danh sách cố định. `objectives` được chèn sau title nếu bật mục tiêu học tập.
- Các tab phụ có template mặc định như trên; có nút đổi template ở thanh công cụ của từng tab.
- Preview picker dùng thumbnail thực được dựng từ component template, không dùng ảnh AI để minh họa bố cục.

## 9. Hợp đồng API và frontend

### Yêu cầu tạo bài

```json
{
  "topic": "Trận Bạch Đằng năm 1288",
  "slide_count": 10,
  "language_mode": "vi_en",
  "template_policy": {
    "mode": "fixed_sequence",
    "slide_layouts": ["title", "objectives", "context", "timeline", "character", "cause-effect", "quote", "vocab", "quiz", "summary"]
  }
}
```

### Quy tắc phản hồi

- `layout_id` phải thuộc enum được frontend hỗ trợ.
- Khi `template_policy.mode` là `fixed_sequence`, API phải trả đúng các layout được chỉ định, theo đúng thứ tự; API chỉ điền nội dung.
- Khi chọn một layout áp dụng chung, mọi slide phù hợp nhận cùng `layout_id`, trừ title/summary nếu sản phẩm giữ hai trang mở/kết riêng.
- Backend validate các trường bắt buộc theo layout; sai schema thì yêu cầu sửa/chuẩn hóa dữ liệu, không tự chuyển sang bố cục bất kỳ.
- Frontend map `layout_id` → component bằng registry tĩnh. `layout_id` lạ thì fallback sang `context` và ghi log lỗi.
- Bản demo phải dùng cùng registry và schema như API thật.

### Ví dụ phản hồi slide

```json
{
  "layout_id": "cause-effect",
  "title_vi": "Từ địa thế đến chiến thắng",
  "title_en": "From terrain to victory",
  "causes": [{"text_vi": "...", "text_en": "..."}],
  "developments": [{"text_vi": "...", "text_en": "..."}],
  "consequences": [{"text_vi": "...", "text_en": "..."}]
}
```

## 10. Tiêu chí nghiệm thu

- Mỗi `layout_id` hiển thị đúng một bố cục đã mô tả ở desktop và màn hình nhỏ.
- Cùng một JSON luôn tạo cùng bố cục; không có sinh HTML/CSS từ model.
- Đổi `layout_id` đổi component nhưng giữ/ánh xạ được nội dung phù hợp.
- Thiếu trường hoặc thiếu ảnh không làm vỡ trang; hiện trạng thái rỗng rõ ràng.
- Template không bịa số liệu Learning Analytics hoặc nội dung chứng cứ.
- Toàn bộ câu chữ hai ngôn ngữ tuân theo `language_mode`.
- Có thể preview tất cả layout từ dữ liệu mẫu cố định trước khi nối API.

