package org.example.home.controller;

import jakarta.validation .Valid;
import jakarta.validation.constraints.*;
import org.example.home.entity.*;
import org.example.home.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.example.home.service.UserService;
import org.example.home.service.AppointmentService;
import org.example.home.service.OrderService;
import org.example.home.service.MessageService;
import org.example.home.service.ReviewService;
import org.example.home.service.ProviderService;
import org.example.home.service.EmailService;
import org.example.home.service.VerificationCodeService;
import org.example.home.config.WebConfig;

@RestController
@RequestMapping(value = "/api", produces = WebConfig.APPLICATION_JSON_UTF8_VALUE)
public class ApiController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ServiceCategoryRepository categoryRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private ServiceProviderRepository providerRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ProviderAvailabilityRepository availabilityRepository;

    @Autowired
    private ProviderDocumentRepository documentRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private MessageService messageService;

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private ProviderService providerService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private VerificationCodeService verificationCodeService;

    // DTOs for validated requests
    public static class RegisterRequest {
        @NotBlank
        public String username;
        @NotBlank
        public String password;
        public String name;
        @Email
        public String email;
        public String role; // "customer" or "service_provider"
        public String introduction; // for service provider
        public List<Integer> serviceIds; // service IDs that provider can offer (for service provider registration)
    }

    public static class CreateAppointmentRequest {
        @NotNull
        @JsonProperty("customerId")
        public Integer customerId;
        @NotNull
        @JsonProperty("serviceId")
        public Integer serviceId;
        @NotBlank
        @JsonProperty("appointmentTime")
        public String appointmentTime;
        @PositiveOrZero
        @JsonProperty("durationHours")
        public Double durationHours = 1.0;
        @NotBlank
        @JsonProperty("address")
        public String address;
    }

    public static class SendMessageRequest {
        @NotNull
        public Integer senderId;
        @NotNull
        public Integer receiverId;
        @NotBlank
        public String content;
    }

    public static class SubmitReviewRequest {
        @NotNull
        @JsonProperty("appointmentId")
        public Integer appointmentId;
        @NotNull
        @JsonProperty("customerId")
        public Integer customerId;
        @NotNull
        @JsonProperty("providerId")
        public Integer providerId;
        @Min(1)
        @Max(5)
        @JsonProperty("rating")
        public Integer rating;
        @JsonProperty("comment")
        public String comment;
    }

    public static class AddAvailabilityRequest {
        @NotBlank
        public String startTime;
        @NotBlank
        public String endTime;
    }

    public static class AddDocumentRequest {
        @NotBlank
        public String documentType;
        @NotBlank
        public String documentPath;
    }

    public static class UpdateUserProfileRequest {
        public String name;
        public String phone;
        @Email
        public String email;
    }

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostMapping(value = "/login", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        if (username == null || password == null) {
            return ResponseEntity.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", "username and password required"));
        }
        var userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", "invalid credentials"));
        }
        var user = userOpt.get();
        String stored = user.getPassword();
        boolean ok = false;
        if (stored == null) ok = false;
        else if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
            ok = passwordEncoder.matches(password, stored);
        } else {
            ok = stored.equals(password);
        }
        if (!ok) {
            return ResponseEntity.status(401)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", "invalid credentials"));
        }
        // Update last login time
        user.setLastLoginTime(LocalDateTime.now());
        userRepository.save(user);
        // Don't return password to client
        user.setPassword(null);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(user);
    }

    @PostMapping(value = "/register", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        if (userRepository.findByUsername(req.username).isPresent()) {
            return ResponseEntity.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", "Username already taken"));
        }
        User u = new User();
        u.setUsername(req.username);
        u.setPassword(req.password);
        u.setName(req.name != null ? req.name : req.username);
        u.setEmail(req.email);
        u.setRole(req.role != null && "service_provider".equals(req.role) ? "service_provider" : "customer");
        u.setStatus("non_member"); // 新注册用户默认为非会员
        User savedUser = userService.register(u);
        
        // 如果是服务人员，创建ServiceProvider记录
        if ("service_provider".equals(u.getRole())) {
            ServiceProvider sp = new ServiceProvider();
            sp.setUser(savedUser);
            sp.setStatus("pending");
            sp.setRating(0.0);
            sp.setIntroduction(req.introduction != null ? req.introduction : "");
            sp.setJoinDate(LocalDateTime.now());
            ServiceProvider savedProvider = providerRepository.save(sp);
            
            // 如果提供了服务列表，创建关联
            if (req.serviceIds != null && !req.serviceIds.isEmpty()) {
                for (Integer serviceId : req.serviceIds) {
                    providerService.addProviderService(savedProvider.getId(), serviceId);
                }
            }
        }
        
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("success", true, "message", "registered"));
    }

    @GetMapping("/users")
    public List<User> getUsers() {
        return userRepository.findAll();
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<?> updateUserStatus(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || (!status.equals("non_member") && !status.equals("member") && !status.equals("super_member"))) {
            return ResponseEntity.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", "Invalid status. Must be non_member, member, or super_member"));
        }
        return userRepository.findById(id)
                .map(user -> {
                    user.setStatus(status);
                    user.setUpdatedAt(LocalDateTime.now());
                    userRepository.save(user);
                    return ResponseEntity.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(Map.<String, Object>of("success", true));
                })
                .orElse(ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(Map.<String, Object>of("error", "User not found")));
    }

    @GetMapping("/categories")
    public List<ServiceCategory> getCategories() {
        return categoryRepository.findAll();
    }

    @GetMapping("/services")
    public List<ServiceEntity> getServices() {
        return serviceRepository.findAll();
    }

    @GetMapping("/providers")
    public List<ServiceProvider> getProviders() {
        return providerRepository.findAll();
    }

    @GetMapping("/appointments")
    public List<Appointment> getAppointments(@RequestParam(required = false) Integer customerId, @RequestParam(required = false) Integer providerId) {
        List<Appointment> appointments;
        if (customerId != null) {
            appointments = appointmentRepository.findByCustomerIdOrderByAppointmentTimeDesc(customerId);
        } else if (providerId != null) {
            appointments = appointmentRepository.findByProviderIdOrderByAppointmentTimeDesc(providerId);
        } else {
            appointments = appointmentRepository.findAll();
        }
        
        // ========== 详细日志：检查appointment数据中的providerId ==========
        System.out.println("========== getAppointments() - 检查ProviderId ==========");
        System.out.println("查询参数: customerId=" + customerId + ", providerId=" + providerId);
        System.out.println("返回的appointment数量: " + appointments.size());
        
        for (Appointment apt : appointments) {
            System.out.println("--- Appointment ID: " + apt.getId() + " ---");
            System.out.println("  provider对象是否为null: " + (apt.getProvider() == null));
            
            if (apt.getProvider() != null) {
                System.out.println("  provider对象存在，ID: " + apt.getProvider().getId());
            } else {
                System.out.println("  ⚠️  provider对象为NULL！");
            }
            
            // 检查数据库中的实际provider_id值
            Integer providerIdFromDb = apt.getProviderIdFromDb();
            System.out.println("  数据库中的provider_id字段值: " + providerIdFromDb + " (isNull: " + (providerIdFromDb == null) + ")");
            
            Integer providerIdValue = apt.getProviderId();
            System.out.println("  getProviderId()返回值: " + providerIdValue + " (isNull: " + (providerIdValue == null) + ")");
            
            // 诊断信息
            if (providerIdFromDb != null && providerIdFromDb > 0 && apt.getProvider() == null) {
                System.out.println("  ⚠️  警告：数据库中有provider_id=" + providerIdFromDb + "，但provider对象未加载！");
                System.out.println("  这可能是因为LEFT JOIN FETCH没有正确加载provider对象。");
            } else if (providerIdFromDb == null || providerIdFromDb <= 0) {
                System.out.println("  ⚠️  警告：数据库中的provider_id字段为null或无效！");
            }
        }
        System.out.println("========================================================");
        
        return appointments;
    }

    @PostMapping(value = "/appointments", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createAppointment(@Valid @RequestBody CreateAppointmentRequest req) {
        try {
            Appointment a = new Appointment();
            // resolve relations
            var customerOpt = userRepository.findById(req.customerId);
            var serviceOpt = serviceRepository.findById(req.serviceId);
            if (customerOpt.isEmpty() || serviceOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(Map.of("error", "invalid customerId or serviceId"));
            }
            a.setCustomer(customerOpt.get());
            ServiceEntity serviceEntity = serviceOpt.get();
            a.setService(serviceEntity);
            // parse appointmentTime as LocalDateTime (simplified: use LocalDateTime.parse ISO)
            try {
                a.setAppointmentTime(LocalDateTime.parse(req.appointmentTime));
            } catch (Exception e) {
                return ResponseEntity.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(Map.of("error", "Invalid appointment time format. Expected ISO format: yyyy-MM-ddTHH:mm:ss"));
            }
            double duration = req.durationHours != null ? req.durationHours : 1.0;
            a.setDurationHours(duration);
            double unitPrice = serviceEntity.getPrice() != null ? serviceEntity.getPrice() : 0.0;
            a.setPrice(unitPrice * duration);
            a.setAddress(req.address);
            a.setStatus("pending");
            Appointment saved = appointmentService.createAppointment(a);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", "Failed to create appointment: " + e.getMessage()));
        }
    }

    @GetMapping("/orders")
    public List<OrderEntity> getOrders(@RequestParam(required = false) Integer customerId) {
        if (customerId != null) {
            List<Appointment> appts = appointmentRepository.findByCustomerIdOrderByAppointmentTimeDesc(customerId);
            List<Integer> ids = appts.stream().map(Appointment::getId).toList();
            return orderRepository.findByAppointmentIdIn(ids);
        }
        return orderRepository.findAll();
    }

    @PostMapping("/orders/{id}/pay")
    public ResponseEntity<?> payOrder(@PathVariable int id) {
        orderService.payOrder(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        long totalUsers = userRepository.count();
        long totalOrders = orderRepository.count();
        Double revenue = orderRepository.findAll().stream().mapToDouble(o -> o.getAmount() != null ? o.getAmount() : 0.0).sum();
        long pendingAppts = appointmentRepository.findAll().stream().filter(a -> "pending".equals(a.getStatus())).count();
        
        // 计算今日访问用户数（last_login_time在今天）
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1);
        long todayVisitors = userRepository.countTodayVisitors(todayStart, todayEnd);
        
        return Map.of(
                "total_users", totalUsers,
                "total_orders", totalOrders,
                "revenue", revenue,
                "pending_appointments", pendingAppts,
                "today_visitors", todayVisitors
        );
    }
    
    @GetMapping("/stats/today_visitors")
    public Map<String, Object> getTodayVisitors() {
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1);
        long count = userRepository.countTodayVisitors(todayStart, todayEnd);
        return Map.of("count", count);
    }

    @GetMapping("/stats/today_orders")
    public Map<String, Object> getTodayOrders() {
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1);
        
        // 查询今日订单
        List<OrderEntity> todayOrders = orderRepository.findByCreatedAtBetween(todayStart, todayEnd);
        
        // 计算今日订单总数
        long todayOrdersCount = todayOrders.size();
        
        // 计算今日营业额（所有今日订单的金额总和）
        Double todayRevenue = todayOrders.stream()
                .mapToDouble(o -> o.getAmount() != null ? o.getAmount() : 0.0)
                .sum();
        
        return Map.<String, Object>of(
                "count", todayOrdersCount,
                "revenue", todayRevenue != null ? todayRevenue : 0.0
        );
    }

    @GetMapping("/stats/revenue_by_month")
    public List<Map<String, Object>> getRevenueByMonth(@RequestParam(value = "year", required = false) Integer year) {
        int targetYear = year != null ? year : LocalDate.now().getYear();
        Map<Integer, Double> revenueByMonth = new HashMap<>();
        orderRepository.findAll().forEach(order -> {
            LocalDate date = null;
            if (order.getCreatedAt() != null) {
                date = order.getCreatedAt().toLocalDate();
            } else if (order.getAppointment() != null && order.getAppointment().getAppointmentTime() != null) {
                date = order.getAppointment().getAppointmentTime().toLocalDate();
            }
            if (date != null && date.getYear() == targetYear) {
                int month = date.getMonthValue();
                double amount = order.getAmount() != null ? order.getAmount() : 0.0;
                revenueByMonth.merge(month, amount, Double::sum);
            }
        });
        List<Map<String, Object>> response = new ArrayList<>();
        for (int month = 1; month <= 12; month++) {
            Month m = Month.of(month);
            String label = m.getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            double revenue = revenueByMonth.getOrDefault(month, 0.0);
            response.add(Map.of(
                    "month", label,
                    "revenue", revenue
            ));
        }
        return response;
    }

    @GetMapping("/providers/{providerId}/weekly_earnings")
    public List<Map<String, Object>> getProviderWeeklyEarnings(@PathVariable int providerId) {
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(6);
        var startDateTime = startDate.atStartOfDay();
        var endDateTime = today.plusDays(1).atStartOfDay();

        var earnings = appointmentRepository.findByProviderIdAndAppointmentTimeBetweenOrderByAppointmentTimeAsc(
                providerId, startDateTime, endDateTime);

        Map<LocalDate, Double> daily = new LinkedHashMap<>();
        for (int i = 0; i < 7; i++) {
            LocalDate date = startDate.plusDays(i);
            daily.put(date, 0.0);
        }

        earnings.forEach(appt -> {
            if (appt.getAppointmentTime() == null) return;
            LocalDate apptDate = appt.getAppointmentTime().toLocalDate();
            if (!daily.containsKey(apptDate)) return;
            double price = 0.0;
            if (appt.getPrice() != null) {
                price = appt.getPrice();
            } else if (appt.getService() != null && appt.getService().getPrice() != null && appt.getDurationHours() != null) {
                price = appt.getService().getPrice() * appt.getDurationHours();
            }
            daily.put(apptDate, daily.get(apptDate) + price);
        });

        List<Map<String, Object>> response = new ArrayList<>();
        daily.forEach((date, revenue) -> {
            String label = date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.SIMPLIFIED_CHINESE);
            response.add(Map.of(
                    "name", label,
                    "income", revenue
            ));
        });
        return response;
    }

    @GetMapping("/stats/weekly_orders")
    public List<Map<String, Object>> getWeeklyOrders() {
        LocalDate today = LocalDate.now();
        // 计算本周的周一（今天往前推，直到找到周一）
        int daysFromMonday = today.getDayOfWeek().getValue() - 1; // Monday=1, so subtract 1 to get days from Monday
        LocalDate monday = today.minusDays(daysFromMonday);
        var startDateTime = monday.atStartOfDay();
        var endDateTime = monday.plusDays(7).atStartOfDay(); // 周一到下周一之前

        // 初始化每天订单数为0
        Map<LocalDate, Integer> daily = new LinkedHashMap<>();
        for (int i = 0; i < 7; i++) {
            LocalDate date = monday.plusDays(i);
            daily.put(date, 0);
        }

        // 查询本周范围内的所有订单（使用created_at字段）
        List<OrderEntity> weeklyOrders = orderRepository.findByCreatedAtBetween(startDateTime, endDateTime);
        
        // 统计每天的订单数
        for (OrderEntity order : weeklyOrders) {
            if (order.getCreatedAt() != null) {
                LocalDate orderDate = order.getCreatedAt().toLocalDate();
                if (daily.containsKey(orderDate)) {
                    daily.put(orderDate, daily.get(orderDate) + 1);
                }
            }
        }

        // 按照周一到周日的顺序返回数据
        List<Map<String, Object>> response = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate date = monday.plusDays(i);
            int count = daily.getOrDefault(date, 0);
            String label = date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.SIMPLIFIED_CHINESE);
            response.add(Map.of(
                    "name", label,
                    "value", count
            ));
        }
        return response;
    }

    @PostMapping(value = "/auth/send_verification_code", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> sendVerificationCode(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", "Email is required"));
        }
        String code = verificationCodeService.generateCode(email);
        emailService.sendVerificationCode(email, code);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("success", true, "message", "Verification code sent"));
    }

    @PostMapping(value = "/auth/verify_code", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> verifyCode(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String code = body.get("code");
        if (email == null || code == null) {
            return ResponseEntity.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", "Email and code are required"));
        }
        boolean valid = verificationCodeService.validateCode(email, code);
        if (!valid) {
            return ResponseEntity.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("success", false, "message", "Invalid or expired code"));
        }
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("success", true));
    }

    // -------- Messages --------
    @GetMapping("/messages")
    public List<Message> getMessages(@RequestParam(required = false) Integer userId) {
        if (userId != null) return messageRepository.findBySenderIdOrReceiverIdOrderByCreatedAtDesc(userId, userId);
        return messageRepository.findAll();
    }

    @PostMapping("/messages")
    public ResponseEntity<?> sendMessage(@Valid @RequestBody SendMessageRequest req) {
        Message m = new Message();
        m.setSenderId(req.senderId);
        m.setReceiverId(req.receiverId);
        m.setContent(req.content);
        messageService.sendMessage(m);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // -------- Provider availability --------
    @GetMapping("/providers/{providerId}/availability")
    public List<ProviderAvailability> getProviderAvailability(@PathVariable int providerId) {
        return availabilityRepository.findByProviderIdOrderByStartTime(providerId);
    }

    @PostMapping("/providers/{providerId}/availability")
    public ResponseEntity<?> addProviderAvailability(@PathVariable int providerId, @Valid @RequestBody AddAvailabilityRequest req) {
        ProviderAvailability p = new ProviderAvailability();
        p.setProviderId(providerId);
        p.setStartTime(LocalDateTime.parse(req.startTime));
        p.setEndTime(LocalDateTime.parse(req.endTime));
        p.setIsBooked(false);
        providerService.addAvailability(p);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/provider_availability/{id}/book")
    public ResponseEntity<?> bookAvailability(@PathVariable int id) {
        providerService.bookAvailability(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // -------- Provider documents / qualifications --------
    @GetMapping("/providers/{providerId}/documents")
    public List<ProviderDocument> getProviderDocuments(@PathVariable int providerId) {
        return documentRepository.findByProviderId(providerId);
    }

    @PostMapping("/providers/{providerId}/documents")
    public ResponseEntity<?> addProviderDocument(@PathVariable int providerId, @Valid @RequestBody AddDocumentRequest req) {
        ProviderDocument d = new ProviderDocument();
        d.setProviderId(providerId);
        d.setDocumentType(req.documentType);
        d.setDocumentPath(req.documentPath);
        providerService.addDocument(d);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/provider_documents/{id}/review")
    public ResponseEntity<?> reviewProviderDocument(@PathVariable int id, @RequestBody Map<String, Object> body) {
        String status = (String) body.get("status");
        Integer reviewerId = (Integer) body.get("reviewerId");
        providerService.reviewDocument(id, status, reviewerId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // -------- Reviews --------
    @GetMapping("/providers/{providerId}/reviews")
    public List<Review> getProviderReviews(@PathVariable int providerId) {
        return reviewRepository.findByProviderIdOrderByCreatedAtDesc(providerId);
    }

    @PostMapping("/reviews")
    public ResponseEntity<?> submitReview(@Valid @RequestBody SubmitReviewRequest req) {
        try {
            // ========== 详细日志：记录接收到的请求数据 ==========
            System.out.println("========== Review Submission Request Received ==========");
            System.out.println("【完整请求数据】");
            System.out.println("  appointmentId: " + req.appointmentId + " (type: " + (req.appointmentId != null ? req.appointmentId.getClass().getSimpleName() : "null") + ")");
            System.out.println("  customerId: " + req.customerId + " (type: " + (req.customerId != null ? req.customerId.getClass().getSimpleName() : "null") + ")");
            System.out.println("  providerId: " + req.providerId + " (type: " + (req.providerId != null ? req.providerId.getClass().getSimpleName() : "null") + ", isNull: " + (req.providerId == null) + ")");
            System.out.println("  rating: " + req.rating + " (type: " + (req.rating != null ? req.rating.getClass().getSimpleName() : "null") + ")");
            System.out.println("  comment: " + (req.comment != null ? (req.comment.length() > 50 ? req.comment.substring(0, 50) + "..." : req.comment) : "null"));
            
            // 特别检查 providerId
            System.out.println("【ProviderId 详细检查】");
            if (req.providerId == null) {
                System.out.println("  ❌ providerId 为 NULL");
                System.out.println("  ⚠️  这可能是导致错误的原因！");
            } else {
                System.out.println("  ✅ providerId 不为空");
                System.out.println("  providerId 值: " + req.providerId);
                System.out.println("  providerId 类型: " + req.providerId.getClass().getSimpleName());
                System.out.println("  providerId 是否 > 0: " + (req.providerId > 0));
                if (req.providerId <= 0) {
                    System.out.println("  ⚠️  providerId 值无效（<= 0）");
                }
            }
            System.out.println("========================================================");
            
            // 验证必需的字段（@Valid 应该已经验证了，但这里做双重检查）
            if (req.appointmentId == null || req.customerId == null || req.providerId == null || req.rating == null) {
                String missingFields = "";
                if (req.appointmentId == null) missingFields += "appointmentId ";
                if (req.customerId == null) missingFields += "customerId ";
                if (req.providerId == null) missingFields += "providerId ";
                if (req.rating == null) missingFields += "rating ";
                
                System.out.println("【验证失败】缺少必需字段: " + missingFields.trim());
                System.out.println("  当前请求对象状态:");
                System.out.println("    req.appointmentId = " + req.appointmentId);
                System.out.println("    req.customerId = " + req.customerId);
                System.out.println("    req.providerId = " + req.providerId);
                System.out.println("    req.rating = " + req.rating);
                
                return ResponseEntity.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(Map.of("error", "Missing required fields: " + missingFields.trim()));
            }
            
            System.out.println("【验证通过】所有必需字段都存在，开始创建Review对象");
            
            Review r = new Review();
            r.setAppointmentId(req.appointmentId);
            r.setCustomerId(req.customerId);
            r.setProviderId(req.providerId);
            r.setRating(req.rating);
            r.setComment(req.comment != null ? req.comment : "");
            
            System.out.println("【Review对象创建完成】");
            System.out.println("  Review.appointmentId = " + r.getAppointmentId());
            System.out.println("  Review.customerId = " + r.getCustomerId());
            System.out.println("  Review.providerId = " + r.getProviderId());
            System.out.println("  Review.rating = " + r.getRating());
            
            Review saved = reviewService.submitReview(r);
            System.out.println("【保存成功】Review saved successfully with ID: " + saved.getId());
            System.out.println("========================================================");
            return ResponseEntity.ok(Map.of("success", true, "reviewId", saved.getId()));
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // 处理数据库唯一约束违反（如果同一个预约已经有评价）
            System.out.println("【数据库约束错误】DataIntegrityViolationException:");
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", "A review for this appointment already exists"));
        } catch (Exception e) {
            System.out.println("【异常错误】Exception occurred:");
            System.out.println("  错误类型: " + e.getClass().getName());
            System.out.println("  错误消息: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", "Failed to submit review: " + e.getMessage()));
        }
    }

    @GetMapping("/services/{serviceId}/reviews")
    public List<Review> getServiceReviews(@PathVariable int serviceId) {
        // join via appointments not implemented in repository; fallback to all reviews for demo
        return reviewRepository.findAll();
    }

    // -------- Additional helpers --------
    @GetMapping("/services/{id}")
    public ResponseEntity<?> getServiceById(@PathVariable int id) {
        return serviceRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/providers/{id}")
    public ResponseEntity<?> getProviderById(@PathVariable int id) {
        return providerRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/services/by_provider/{providerId}")
    public List<ServiceEntity> getServicesByProvider(@PathVariable int providerId) {
        // 返回该服务人员实际能提供的服务列表
        List<org.example.home.entity.ProviderServiceEntity> providerServices = providerService.getProviderServices(providerId);
        List<Integer> serviceIds = providerServices.stream()
            .map(org.example.home.entity.ProviderServiceEntity::getServiceId)
            .toList();
        return serviceRepository.findAll().stream()
            .filter(s -> serviceIds.contains(s.getId()))
            .toList();
    }

    @PostMapping("/appointments/{id}/status")
    public ResponseEntity<?> updateAppointmentStatus(@PathVariable int id, @RequestBody Map<String, Object> body) {
        String status = (String) body.get("status");
        appointmentRepository.findById(id).ifPresent(a -> { a.setStatus(status); a.setUpdatedAt(LocalDateTime.now()); appointmentRepository.save(a); });
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping(value = "/appointments/{id}/reschedule", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> rescheduleAppointment(@PathVariable int id, @RequestBody Map<String, Object> body) {
        try {
            String newTime = (String) body.get("newDateTime");
            String address = (String) body.get("address");
            
            appointmentRepository.findById(id).ifPresent(a -> {
                a.setAppointmentTime(LocalDateTime.parse(newTime));
                a.setStatus("pending");
                if (address != null && !address.trim().isEmpty()) {
                    a.setAddress(address.trim());
                }
                a.setUpdatedAt(LocalDateTime.now());
                appointmentRepository.save(a);
            });
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("success", true));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", "Failed to reschedule appointment: " + e.getMessage()));
        }
    }

    @PostMapping(value = "/appointments/{id}/address", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateAppointmentAddress(@PathVariable int id, @RequestBody Map<String, Object> body) {
        try {
            String address = (String) body.get("address");
            if (address == null || address.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(Map.of("error", "Address cannot be empty"));
            }
            appointmentRepository.findById(id).ifPresent(a -> {
                a.setAddress(address.trim());
                a.setUpdatedAt(LocalDateTime.now());
                appointmentRepository.save(a);
            });
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("success", true));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", "Failed to update address: " + e.getMessage()));
        }
    }

    @PostMapping("/appointments/{id}/reminder")
    public ResponseEntity<?> sendAppointmentReminder(@PathVariable int id, @RequestBody Map<String, Object> body) {
        String type = (String) body.getOrDefault("type", "email");
        System.out.printf("[REMINDER] appointment %d via %s\n", id, type);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/appointments/{id}/provider")
    public ResponseEntity<?> updateAppointmentProvider(@PathVariable("id") int id, @RequestBody Map<String, Object> body) {
        try {
            Object providerIdObj = body.get("providerId");
            Integer providerId = null;
            if (providerIdObj != null) {
                if (providerIdObj instanceof Integer) {
                    providerId = (Integer) providerIdObj;
                } else if (providerIdObj instanceof Number) {
                    providerId = ((Number) providerIdObj).intValue();
                } else if (providerIdObj instanceof String) {
                    try {
                        providerId = Integer.parseInt((String) providerIdObj);
                    } catch (NumberFormatException e) {
                        return ResponseEntity.badRequest()
                                .contentType(MediaType.APPLICATION_JSON)
                                .body(Map.of("error", "Invalid providerId format"));
                    }
                }
            }
            appointmentService.updateProvider(id, providerId);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", "Failed to update provider: " + e.getMessage()));
        }
    }

    // -------- User profile update --------
    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUserProfile(@PathVariable int id, @Valid @RequestBody UpdateUserProfileRequest req) {
        userService.updateProfile(id, req.name, req.phone, req.email);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/users/{id}/profile_picture")
    public ResponseEntity<?> uploadProfilePicture(@PathVariable int id, @RequestBody Map<String, Object> body) {
        String url = (String) body.get("profilePicture");
        userRepository.findById(id).ifPresent(u -> { u.setProfilePicture(url); u.setUpdatedAt(LocalDateTime.now()); userRepository.save(u); });
        return ResponseEntity.ok(Map.of("success", true));
    }

    // -------- Provider Services Management --------
    @GetMapping("/providers/{providerId}/services")
    public List<ServiceEntity> getProviderServices(@PathVariable int providerId) {
        return getServicesByProvider(providerId);
    }

    @PostMapping("/providers/{providerId}/services")
    public ResponseEntity<?> addProviderService(@PathVariable int providerId, @RequestBody Map<String, Object> body) {
        try {
            Integer serviceId = (Integer) body.get("serviceId");
            if (serviceId == null) {
                return ResponseEntity.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", "serviceId is required"));
            }
            providerService.addProviderService(providerId, serviceId);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("error", "Failed to add service: " + e.getMessage()));
        }
    }

    @DeleteMapping("/providers/{providerId}/services/{serviceId}")
    public ResponseEntity<?> removeProviderService(@PathVariable int providerId, @PathVariable int serviceId) {
        try {
            providerService.removeProviderService(providerId, serviceId);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("error", "Failed to remove service: " + e.getMessage()));
        }
    }

    @PutMapping("/providers/{providerId}/services")
    public ResponseEntity<?> updateProviderServices(@PathVariable int providerId, @RequestBody Map<String, Object> body) {
        try {
            @SuppressWarnings("unchecked")
            List<Integer> serviceIds = (List<Integer>) body.get("serviceIds");
            if (serviceIds == null) {
                return ResponseEntity.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", "serviceIds is required"));
            }
            providerService.updateProviderServices(providerId, serviceIds);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("error", "Failed to update services: " + e.getMessage()));
        }
    }
}
