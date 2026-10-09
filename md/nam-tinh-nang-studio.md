# Năm tính năng studio – WEWIN AI History Lab

Đây là mô tả hệ thống đang chạy, để một AI khác tiếp tục thiết kế sản phẩm. Tài liệu nói hành vi hiện tại của website. Đây không phải hướng dẫn cài đặt.

WEWIN AI History Lab giúp giáo viên biến tư liệu lịch sử đã kiểm chứng thành một bài giảng song ngữ Anh–Việt. Giáo viên nhập chủ đề, tư liệu và số slide. Một lần bấm tạo, hệ thống sinh cùng lúc năm phần và gắn vào cùng một bài giảng: Bài học AI, Knowledge Graph, Time Travel, AI vs History, Learning Analytics.

Năm phần là năm tab trên cùng một màn hình. Tab luôn hiện, kể cả khi chưa có bài. Sau khi tạo xong, màn hình mở tab Knowledge Graph. Giáo viên chuyển tab để xem các phần còn lại. Không có bài mẫu cố định. Studio trống cho đến khi giáo viên gửi tư liệu thật và hệ thống tạo bài.

Khi có `OPENAI_API_KEY`, model mặc định trong mã là `gpt-5-nano`. Biến `MODEL` có thể đổi tên model đó. Nếu chỉ có khóa Anthropic, hệ thống gọi model Anthropic mặc định trong mã. Nếu không có khóa nào, hệ thống không gọi AI: nó cắt tư liệu thành đúng số slide và điền tiếng Anh bằng một câu giữ chỗ.

## Đường vào studio

Giáo viên tới năm tab bằng đăng nhập, rồi chọn thiết kế. Người chưa đăng nhập thấy form tên đăng nhập và mật khẩu. Hai vai: Giáo viên và Quản trị. Sau đăng nhập, header hiện tên tài khoản, vai, và nút đăng xuất. Màn hình “Thiết kế của bạn” là thư viện. Thẻ New (“Tạo thiết kế mới”) mở studio trống. Mỗi bài đã lưu là một thẻ Open, hiện tiêu đề và thời điểm cập nhật. Nếu chưa có bài đã lưu, thư viện chỉ còn thẻ New và dòng “Chưa có thiết kế đã lưu.” Giáo viên chỉ thấy thiết kế của mình. Quản trị thấy mọi thiết kế, kèm tên chủ sở hữu. Quản trị còn có trang Quản trị; trang đó chưa có công cụ riêng, và nói việc mở cùng lưu mọi thiết kế nằm ở màn hình bắt đầu. Studio không mở cho khách chưa đăng nhập. Nếu cơ sở dữ liệu không kết nối được, màn hình đăng nhập báo lỗi đó.

Trên studio, thanh file nằm phía trên năm tab: New, Open, Save, Download PDF, Present. New xóa bài đang mở và về studio trống. Open quay lại thư viện. Save ghi thiết kế: bài chưa có mã thì tạo bản ghi, bài đã có mã thì ghi các sửa đổi. Download PDF và Present chỉ bật khi đã có bài.

## Một lần nhập, năm phần dùng chung

Form bên trái tên là “Tạo trải nghiệm lịch sử”. Giáo viên nhập:

- Chủ đề. Ô để trống; giáo viên phải nhập. Gợi ý trên ô: “Nhập chủ đề bài học”.
- Tư liệu: dán text, hoặc tải nhiều file PDF có chữ / Word (.docx) / TXT / ảnh (png, jpg, jpeg, webp), hoặc một link website http/https.
- Khối lớp: Grade 4 đến Grade 9. Mặc định Grade 5.
- English CEFR: A1, A2, B1, B2. Mặc định A2.
- Teaching Mode: Storytelling, Time Travel, History Detective, Role Play. Mặc định Time Travel. Mode được gửi vào lời nhắc cho AI. Mode không đổi bộ năm tab.
- Số slide: từ 3 đến 30. Mặc định 10.
- Thời lượng: từ 5 đến 180 phút. Mặc định 40. Thời lượng cũng chỉ được gửi vào lời nhắc.
- Template: “AI chọn layout”, hoặc một layout cố định (timeline, map, character, comparison, cause-effect, quote, summary).
- Ghi chú tự do, ví dụ nhấn mạnh nguyên nhân và hệ quả.

Kết quả là một bài giảng gồm: tiêu đề Việt và Anh, danh sách cảnh báo, các slide, một knowledge graph, một mission Time Travel, và một danh sách câu AI vs History. Nếu lưu cơ sở dữ liệu được, bài có mã và các lần sửa sau đó được ghi lại. Nếu chưa lưu được, giáo viên vẫn xem và sửa trong phiên đó; form hiện cảnh báo.

AI được yêu cầu chỉ dùng thông tin trong tư liệu, không tự thêm dữ kiện lịch sử, và không mô tả hay gắn hình bằng AI Vision. Tiếng Anh phải viết lại đúng CEFR đã chọn, không dịch từng chữ. Tên riêng giữ tiếng Việt. Lời nhắc và JSON mẫu không có ghi chú giảng dạy, không có câu trích khóa nguồn, và không có cờ đối chiếu nguồn. Nếu phản hồi cũ hoặc bài đã lưu còn các trường đó, chuẩn hóa bỏ chúng trước khi đưa lên màn hình.

Sau khi AI trả lời, nếu AI trả sai số slide, hệ thống cắt bớt hoặc nhân bản slide cuối thành slide tổng kết cho đủ số giáo viên nhập, rồi cảnh báo. Từ 20 slide trở lên có cảnh báo thời gian và chi phí. Tư liệu quá ngắn so với số slide cũng bị cảnh báo là nội dung có thể lặp hoặc nông.

## Tư liệu đi vào như thế nào

Text dán, chữ trong file và chữ lấy từ website được nối lại, tối đa 40.000 ký tự.

- PDF: lấy lớp chữ có sẵn. Nếu phần chữ quá ngắn, hệ thống coi PDF là ảnh scan và dừng, với thông báo bản này chưa OCR. Giáo viên cần dán text hoặc dùng PDF có chữ.
- Word: lấy text thô từ file .docx.
- TXT: đọc như văn bản.
- Ảnh tải kèm tư liệu: chỉ được lưu để giáo viên đặt lên slide. Ảnh không được OCR và không được AI Vision đọc. Nếu gần như chỉ có ảnh, hệ thống cảnh báo hãy dán phần chữ.
- Link: chỉ http/https, không gọi địa chỉ nội bộ, hết giờ sau vài giây, bỏ qua trang quá lớn, rồi lấy chữ từ HTML.

Ảnh đầu tiên trong tư liệu được gắn sẵn lên slide đầu. Các ảnh khác không tự nhảy vào từng slide. Trong lúc sửa bài, giáo viên tải thêm ảnh và kéo ảnh trên slide. Ảnh giáo viên thêm bị giới hạn dung lượng và chỉ nhận file ảnh.

Trên tab Bài học AI có công tắc ngôn ngữ: VI, VI + EN, EN. Công tắc này cũng điều khiển câu chữ của Time Travel và AI vs History. Knowledge Graph và Learning Analytics không đổi theo công tắc.

# 1. Bài học AI

## Mục đích với giáo viên / học sinh

Giáo viên có một bộ slide lịch sử song ngữ để xem, sửa, trình chiếu hoặc xuất file. Học sinh đọc tiêu đề, ý chính, từ vựng và trả lời câu trắc nghiệm ngay trên slide.

## Người dùng thấy gì trên màn hình

Mỗi slide hiện nhãn layout, số thứ tự, tiêu đề, nội dung, từ vựng nếu có, câu hỏi và các lựa chọn nếu có. Chọn một đáp án thì nút khóa lại: đáp án đúng tô một kiểu, đáp án sai vừa chọn tô kiểu khác, và hiện phản hồi song ngữ.

Cách vẽ nội dung phụ thuộc layout đã có sẵn. Model chỉ chọn một id trong danh sách cố định và điền chữ; không bịa layout, không xuất HTML/CSS. Id lạ được đưa về layout gần nhất trong danh sách (không đoán được thì dùng `context`) và không được lưu thành layout mới.

- Timeline đọc tối đa bốn dòng `nhãn | mô tả`. Nếu thân bài chưa có dấu `|`, giao diện tách `body_vi` theo dấu câu, tối đa bốn thẻ, và không hiện thân tiếng Anh.
- Comparison đọc hai vế A/B và câu kết. Cause–effect đọc ba mục Nguyên nhân, Diễn biến, Hệ quả. Không lặp cùng một đoạn vào mọi thẻ.
- Quote đưa thân bài vào khung trích. Không có chữ thì khung báo chưa có nội dung.
- Các layout còn lại đổ tiêu đề, thân bài song ngữ, từ vựng và câu hỏi vào đúng vùng của layout đó.

Trên tab này có thanh riêng: công tắc ngôn ngữ, nút Sửa, nút PowerPoint, và lùi/tiến slide. Chế độ Sửa cho sửa tiêu đề Việt, tiêu đề Anh, nội dung Việt, nội dung Anh và layout. Giáo viên kéo thẻ slide để đổi thứ tự, đưa lên, đưa xuống, thêm slide trống hoặc xóa slide khi còn nhiều hơn một slide. Sửa xong được ghi lại nếu bài đã có mã.

Trình chiếu phủ toàn màn hình. Nút Present hoặc phím F5 bắt đầu; khi đã có bài, F5 không làm mới trang. Click trái trên slide sang slide sau. Click phải trên slide về slide trước. Escape hoặc nút Thoát để ra. Trong lúc trình chiếu, phím mũi tên trái và phải cũng đổi slide, và lớp phủ còn nút Trước cùng Sau. Download PDF tải một file PDF do máy chủ dựng bằng pdf-lib. Mỗi slide là một trang nền xanh: số thứ tự, tiêu đề Việt, tiêu đề Anh nếu có, thân bài Việt và thân bài Anh. Tên file lấy từ tiêu đề bài. PowerPoint tải file `WEWIN-AI-History-Lab.pptx`: nền xanh, tiêu đề Việt, tiêu đề Anh và hai thân bài. File không có phần ghi chú của slide.

Layout hợp lệ, và là danh sách duy nhất model được chọn: title, objectives, context, timeline, map, character, comparison, cause-effect, quote, vocab, quiz, summary. Slide đầu của bản không có API luôn là title, slide cuối là summary. Nếu giáo viên chọn một template cụ thể, các slide giữa dùng layout đó. Nếu để “AI chọn layout” và không có API, các slide giữa xoay vòng các layout ở giữa. Khi có API, model tự chọn layout; template trên form chỉ là ưu tiên trong lời nhắc. Giáo viên vẫn đổi layout từng slide sau đó.

## Dữ liệu đi vào và kết quả ra

Vào: chủ đề, tư liệu đã trích, khối, CEFR, mode, số slide, thời lượng, template, ghi chú.

Ra: đúng số slide đã nhập. Mỗi slide có layout, tiêu đề và thân bài hai ngôn ngữ, danh sách từ (`en` / `vi`), câu hỏi hai ngôn ngữ, các lựa chọn (đúng/sai và phản hồi hai ngôn ngữ), và vị trí ảnh nếu có.

## Nối với tư liệu và song ngữ CEFR

Nội dung slide được viết từ tư liệu đã trích. Khi không có API, thân tiếng Việt là các đoạn cắt từ tư liệu hoặc chủ đề; thân tiếng Anh là câu giữ chỗ, chờ API viết lại theo CEFR. Bài cũ còn ghi chú giảng dạy hoặc câu trích khóa nguồn cũng không hiện hai khối đó.

## Giới hạn hiện tại

Nếu thân bài chưa đúng dạng từng layout, giao diện chia câu vào các thẻ của layout gần nhất, không tạo bố cục mới. PowerPoint là trang chữ đơn giản, không mang layout, từ vựng, câu hỏi hay ảnh. File PDF cũng là trang chữ: không mang layout, từ vựng, câu hỏi hay ảnh. Ảnh không do AI hiểu hay chọn chỗ. Thêm slide mới là bản sao gần như trống, chưa được AI viết tiếp.

# 2. Knowledge Graph

## Mục đích với giáo viên / học sinh

Giáo viên và học sinh nhìn tư liệu vừa được cấu trúc thành các nút lịch sử và các đường nối, thay vì chỉ một dàn slide tuyến tính. Nhãn trên màn hình nói AI nhóm Person, Event, Time, Place, Cause, Consequence. Trong lời nhắc, loại nút còn có Decision.

## Người dùng thấy gì trên màn hình

Tiêu đề “Historical Knowledge Graph”, dòng mô tả các loại nút, và huy hiệu SOURCE-GROUNDED. Các nút nằm trên một vòng tròn. Mỗi nút hiện nhãn chữ; rê chuột thấy loại nút. Các cạnh là những đoạn thẳng nối nút, không hiện chữ nhãn cạnh. Dưới cùng là câu chú: AI biến nguồn phi cấu trúc thành bản đồ tri thức lịch sử. Không bấm nút để mở chi tiết, không lọc, không sửa graph trên màn hình.

## Dữ liệu đi vào và kết quả ra

Vào: cùng tư liệu và chủ đề đã dùng để tạo slide.

Ra: `graph.nodes` (id, label, type) và `graph.edges` (from, to, label). Không có đồ thị mẫu viết sẵn. Graph chỉ có sau khi giáo viên tạo bài từ tư liệu.

Khi không có API, graph lấy tối đa sáu tiêu đề slide đầu, loại nút bằng tên layout, cạnh nối tuần tự và nhãn “tiếp theo”.

## Nối với tư liệu và song ngữ CEFR

Huy hiệu SOURCE-GROUNDED nói graph phải bám nguồn. Lời nhắc cấm thêm dữ kiện ngoài tư liệu, nên tên nút và quan hệ phải rút từ tư liệu đó. Màn hình graph chỉ vẽ nhãn đã lưu. Bản không có API lấy nhãn từ tiêu đề slide, thường là tiếng Việt. Công tắc VI/EN không đổi graph. CEFR không áp một lớp chữ Anh riêng cho graph trong giao diện hiện tại.

## Giới hạn hiện tại

Nhãn cạnh có trong dữ liệu nhưng không được vẽ. Không sửa từng nút. Bản không có API chưa phải bản đồ nhân vật–sự kiện–địa điểm; nó chỉ xâu tiêu đề slide.

# 3. Time Travel

## Mục đích với giáo viên / học sinh

Học sinh vào một cảnh lịch sử, đọc một câu hỏi quyết định, chọn một hướng đi, rồi đọc hệ quả. Giáo viên dùng phần này như hoạt động nhập vai ngắn, cùng mode giảng trên form nhưng tab này luôn là mission của bài, không đổi giao diện theo từng mode.

## Người dùng thấy gì trên màn hình

Nhãn “AI TIME TRAVEL MISSION”, tiêu đề ENTER HISTORY, đoạn cảnh, câu hỏi, rồi từng nút lựa chọn. Bấm một lựa chọn thì mở hệ quả. Nếu bài không có mission, màn hình báo chưa có Time Travel Mission.

Cảnh, câu hỏi và hệ quả theo công tắc VI / VI+EN / EN. Chữ trên nút lựa chọn luôn hiện cả “tiếng Việt / tiếng Anh”.

## Dữ liệu đi vào và kết quả ra

Vào: chủ đề, tư liệu, CEFR, mode, ghi chú giáo viên.

Ra: một mission gồm cảnh Việt, cảnh Anh, câu hỏi Việt, câu hỏi Anh, và các lựa chọn. Mỗi lựa chọn có chữ hai ngôn ngữ, cờ `historical` và hệ quả hai ngôn ngữ. Cờ `historical` có trong dữ liệu; màn hình không tô riêng lựa chọn “đúng lịch sử”, mà để hệ quả nói rõ.

Bản không có API tạo một cảnh đọc tư liệu về chủ đề vừa nhập, với hai lựa chọn: tìm câu chứng trong tư liệu, hoặc kết luận khi chưa đọc. Không có cảnh mẫu viết sẵn.

## Nối với tư liệu và song ngữ CEFR

Tiếng Anh của cảnh, câu hỏi và hệ quả nằm trong bài và được yêu cầu viết theo CEFR. Nút lựa chọn không ẩn một ngôn ngữ. Lựa chọn không kèm câu trích nguồn.

## Giới hạn hiện tại

Chỉ có một cảnh và một câu hỏi cho cả bài, không có nhiều chặng. Chưa có điểm số, chưa lưu lựa chọn của học sinh, chưa nối lựa chọn với Learning Analytics. Mode trên form không tạo một kiểu chơi khác trên tab này.

# 4. AI vs History

## Mục đích với giáo viên / học sinh

Học sinh tập không tin một câu do AI nói ngay. Em phân loại câu đó là FACT, INTERPRETATION hoặc UNSUPPORTED, rồi đọc giải thích. Giáo viên dùng để luyện cách phân loại nhận định.

## Người dùng thấy gì trên màn hình

Nhãn AI vs HISTORY, tiêu đề “Can you catch the AI?”, một đoạn nhắc phân loại claim và đòi bằng chứng, rồi câu nhận định tiếng Việt và tiếng Anh. Ba nút: FACT, INTERPRETATION, UNSUPPORTED. Sau khi chọn, khung phản hồi nói “Chính xác” hoặc “Hãy kiểm chứng lại”, kèm giải thích theo công tắc ngôn ngữ. Nếu không có câu nào, màn hình báo chưa có thử thách.

## Dữ liệu đi vào và kết quả ra

Vào: cùng tư liệu và chủ đề.

Ra: danh sách `ai_vs_history`. Mỗi phần tử có câu Việt, câu Anh, đáp án đúng (`fact`, `interpretation` hoặc `unsupported`) và giải thích hai ngôn ngữ. Giá trị đáp án lạ được chuẩn hóa thành `unsupported`. Không lưu câu trích hay cờ đối chiếu.

Màn hình chỉ lấy phần tử đầu tiên. Các câu sau, nếu AI có trả, không được vẽ.

Bản không có API tạo một câu cố định: không được thêm dữ kiện khi tư liệu không nhắc, đáp án `unsupported`.

## Nối với tư liệu và song ngữ CEFR

Câu nhận định trên màn hình luôn hiện cả hai ngôn ngữ. Giải thích theo công tắc VI/EN và được yêu cầu viết tiếng Anh theo CEFR. Nội dung được yêu cầu bám tư liệu đã trích; màn hình không hiện câu trích khóa nguồn.

## Giới hạn hiện tại

Một bài có thể chứa nhiều câu, nhưng người học chỉ thấy câu đầu. Chưa có lượt chơi tiếp, chưa lưu đáp án, chưa tính vào báo cáo.

# 5. Learning Analytics

## Mục đích với giáo viên / học sinh

Tab này là chỗ sẽ xem kết quả học tập sau này. Bản hiện tại chưa đo học sinh, nên không hiện số liệu.

## Người dùng thấy gì trên màn hình

Khi đã có bài giảng, tab hiện trạng thái trống: tiêu đề Learning Analytics và câu “Chưa có dữ liệu học tập.” Không có phần trăm, không có nhận xét viết sẵn, không có nút tạo hoạt động tiếp theo. Khi chưa có bài, cả vùng nội dung vẫn là màn hình trống của studio: “Tải nguồn lịch sử đã kiểm chứng để AI tạo trải nghiệm.”

## Dữ liệu đi vào và kết quả ra

Tab không nhận bài giảng, không nhận đáp án trắc nghiệm, không nhận lựa chọn Time Travel hay AI vs History. Không có dữ liệu học sinh đi vào. Kết quả ra là trạng thái trống, không phải bốn chỉ số.

## Nối với tư liệu và song ngữ CEFR

Tab không đọc tư liệu, không đổi theo CEFR hay công tắc ngôn ngữ. Bốn tab kia mới là nơi nội dung bám nguồn và song ngữ.

## Giới hạn hiện tại

Giáo viên đăng nhập để vào studio, nhưng tab này không đọc phiên đó. Chưa có học sinh đăng nhập, chưa có bài làm, chưa có công thức tính chỉ số. Tab không bịa số liệu khi chưa có dữ liệu học tập.
