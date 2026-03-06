import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Mixins
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profiles
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Orders
  type OrderRecord = {
    id : Nat;
    orderId : Text;
    name : Text;
    email : Text;
    whatsappNumber : Text;
    service : Text;
    projectDetails : Text;
    budget : Text;
    deadline : Text;
    status : Text;
    paymentStatus : Text;
    createdAt : Int;
    screenshotBlobId : ?Text;
  };

  let orders = Map.empty<Nat, OrderRecord>();
  var nextOrderId = 1;

  public shared func submitOrder(
    orderId : Text,
    name : Text,
    email : Text,
    whatsappNumber : Text,
    service : Text,
    projectDetails : Text,
    budget : Text,
    deadline : Text,
  ) : async Nat {
    let id = nextOrderId;
    let order : OrderRecord = {
      id;
      orderId;
      name;
      email;
      whatsappNumber;
      service;
      projectDetails;
      budget;
      deadline;
      status = "pending";
      paymentStatus = "pending";
      createdAt = Time.now();
      screenshotBlobId = null;
    };
    orders.add(id, order);
    nextOrderId += 1;
    id;
  };

  public query func getOrderByOrderId(orderId : Text) : async ?OrderRecord {
    let iter = orders.values();
    iter.find(
      func(order) {
        order.orderId == orderId;
      }
    );
  };

  public query func getOrdersByEmail(email : Text) : async [OrderRecord] {
    let filtered = List.empty<OrderRecord>();
    let iter = orders.values();
    iter.forEach(
      func(order) {
        if (order.email == email) {
          filtered.add(order);
        };
      }
    );
    filtered.toArray();
  };

  public query ({ caller }) func listAllOrders() : async [OrderRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list all orders");
    };
    orders.values().toArray();
  };

  public shared ({ caller }) func updateOrderStatus(id : Nat, status : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update order status");
    };
    switch (orders.get(id)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updatedOrder : OrderRecord = {
          id = order.id;
          orderId = order.orderId;
          name = order.name;
          email = order.email;
          whatsappNumber = order.whatsappNumber;
          service = order.service;
          projectDetails = order.projectDetails;
          budget = order.budget;
          deadline = order.deadline;
          status;
          paymentStatus = order.paymentStatus;
          createdAt = order.createdAt;
          screenshotBlobId = order.screenshotBlobId;
        };
        orders.add(id, updatedOrder);
      };
    };
  };

  public shared ({ caller }) func updateOrderPaymentStatus(id : Nat, paymentStatus : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update payment status");
    };
    switch (orders.get(id)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updatedOrder : OrderRecord = {
          id = order.id;
          orderId = order.orderId;
          name = order.name;
          email = order.email;
          whatsappNumber = order.whatsappNumber;
          service = order.service;
          projectDetails = order.projectDetails;
          budget = order.budget;
          deadline = order.deadline;
          status = order.status;
          paymentStatus;
          createdAt = order.createdAt;
          screenshotBlobId = order.screenshotBlobId;
        };
        orders.add(id, updatedOrder);
      };
    };
  };

  public shared func updateOrderScreenshot(id : Nat, screenshotBlobId : Text) : async () {
    switch (orders.get(id)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updatedOrder : OrderRecord = {
          id = order.id;
          orderId = order.orderId;
          name = order.name;
          email = order.email;
          whatsappNumber = order.whatsappNumber;
          service = order.service;
          projectDetails = order.projectDetails;
          budget = order.budget;
          deadline = order.deadline;
          status = order.status;
          paymentStatus = order.paymentStatus;
          createdAt = order.createdAt;
          screenshotBlobId = ?screenshotBlobId;
        };
        orders.add(id, updatedOrder);
      };
    };
  };

  // Problem Reports
  type ProblemReport = {
    id : Nat;
    name : Text;
    email : Text;
    orderId : ?Text;
    description : Text;
    status : Text;
    timestamp : Int;
  };

  let problemReports = Map.empty<Nat, ProblemReport>();
  var nextProblemReportId = 1;

  public shared func submitProblemReport(name : Text, email : Text, orderId : ?Text, description : Text) : async Nat {
    let id = nextProblemReportId;
    let report : ProblemReport = {
      id;
      name;
      email;
      orderId;
      description;
      status = "pending";
      timestamp = Time.now();
    };
    problemReports.add(id, report);
    nextProblemReportId += 1;
    id;
  };

  public query ({ caller }) func listProblemReports() : async [ProblemReport] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list problem reports");
    };
    problemReports.values().toArray();
  };

  public shared ({ caller }) func updateProblemReportStatus(id : Nat, status : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update problem report status");
    };
    switch (problemReports.get(id)) {
      case (null) { Runtime.trap("Problem report not found") };
      case (?report) {
        let updatedReport : ProblemReport = {
          id = report.id;
          name = report.name;
          email = report.email;
          orderId = report.orderId;
          description = report.description;
          status;
          timestamp = report.timestamp;
        };
        problemReports.add(id, updatedReport);
      };
    };
  };

  public shared ({ caller }) func deleteProblemReport(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete problem reports");
    };
    if (not problemReports.containsKey(id)) {
      Runtime.trap("Problem report not found");
    };
    problemReports.remove(id);
  };

  // Payment Settings
  type PaymentSettings = {
    upiId : Text;
    accountHolderName : Text;
    accountNumber : Text;
    ifscCode : Text;
    qrCodeBlobId : Text;
  };

  var paymentSettings : ?PaymentSettings = null;

  public query func getPaymentSettings() : async ?PaymentSettings {
    paymentSettings;
  };

  public shared ({ caller }) func updatePaymentSettings(
    upiId : Text,
    accountHolderName : Text,
    accountNumber : Text,
    ifscCode : Text,
    qrCodeBlobId : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update payment settings");
    };
    let settings : PaymentSettings = {
      upiId;
      accountHolderName;
      accountNumber;
      ifscCode;
      qrCodeBlobId;
    };
    paymentSettings := ?settings;
  };

  // Services
  type Service = {
    id : Nat;
    title : Text;
    description : Text;
    icon : Text;
    category : Text;
    rating : Nat;
    isAvailable : Bool;
  };

  module Service {
    public func compare(service1 : Service, service2 : Service) : Order.Order {
      switch (Text.compare(service1.category, service2.category)) {
        case (#equal) { Nat.compare(service1.id, service2.id) };
        case (order) { order };
      };
    };
  };

  let services = Map.empty<Nat, Service>();
  var nextServiceId = 1;

  public shared ({ caller }) func createService(title : Text, description : Text, icon : Text, category : Text, rating : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create services");
    };
    let id = nextServiceId;
    let service : Service = {
      id;
      title;
      description;
      icon;
      category;
      rating;
      isAvailable = true;
    };
    services.add(id, service);
    nextServiceId += 1;
    id;
  };

  public shared ({ caller }) func updateService(id : Nat, title : Text, description : Text, icon : Text, category : Text, rating : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update services");
    };
    switch (services.get(id)) {
      case (null) { Runtime.trap("Service not found") };
      case (?service) {
        let updatedService : Service = {
          id;
          title;
          description;
          icon;
          category;
          rating;
          isAvailable = service.isAvailable;
        };
        services.add(id, updatedService);
      };
    };
  };

  public shared ({ caller }) func deleteService(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete services");
    };
    if (not services.containsKey(id)) {
      Runtime.trap("Service not found");
    };
    services.remove(id);
  };

  public shared ({ caller }) func toggleServiceAvailability(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can toggle service availability");
    };
    switch (services.get(id)) {
      case (null) { Runtime.trap("Service not found") };
      case (?service) {
        let updatedService : Service = {
          id = service.id;
          title = service.title;
          description = service.description;
          icon = service.icon;
          category = service.category;
          rating = service.rating;
          isAvailable = not service.isAvailable;
        };
        services.add(id, updatedService);
      };
    };
  };

  public query func listServices() : async [Service] {
    services.values().toArray().sort<Service>();
  };

  public query func getService(id : Nat) : async Service {
    switch (services.get(id)) {
      case (null) { Runtime.trap("Service not found") };
      case (?service) { service };
    };
  };

  // Portfolio
  type PortfolioItem = {
    id : Nat;
    title : Text;
    category : Text;
    description : Text;
    blobId : Text;
    mediaType : Text;
    serviceId : ?Nat;
  };

  module PortfolioItem {
    public func compare(item1 : PortfolioItem, item2 : PortfolioItem) : Order.Order {
      switch (Text.compare(item1.category, item2.category)) {
        case (#equal) { Nat.compare(item1.id, item2.id) };
        case (order) { order };
      };
    };
  };

  let portfolio = Map.empty<Nat, PortfolioItem>();
  var nextPortfolioId = 1;

  public shared ({ caller }) func createPortfolio(title : Text, category : Text, description : Text, blobId : Text, mediaType : Text, serviceId : ?Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create portfolio items");
    };
    let id = nextPortfolioId;
    let item : PortfolioItem = {
      id;
      title;
      category;
      description;
      blobId;
      mediaType;
      serviceId;
    };
    portfolio.add(id, item);
    nextPortfolioId += 1;
    id;
  };

  public shared ({ caller }) func updatePortfolio(id : Nat, title : Text, category : Text, description : Text, blobId : Text, mediaType : Text, serviceId : ?Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update portfolio items");
    };
    switch (portfolio.get(id)) {
      case (null) { Runtime.trap("Portfolio item not found") };
      case (?_) {
        let updatedItem : PortfolioItem = {
          id;
          title;
          category;
          description;
          blobId;
          mediaType;
          serviceId;
        };
        portfolio.add(id, updatedItem);
      };
    };
  };

  public shared ({ caller }) func deletePortfolio(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete portfolio items");
    };
    if (not portfolio.containsKey(id)) {
      Runtime.trap("Portfolio item not found");
    };
    portfolio.remove(id);
  };

  public query func listPortfolioItems() : async [PortfolioItem] {
    portfolio.values().toArray().sort<PortfolioItem>();
  };

  public query func filterPortfolioByCategory(category : Text) : async [PortfolioItem] {
    let filtered = List.empty<PortfolioItem>();
    let iter = portfolio.entries();
    iter.forEach(
      func((_, item)) {
        if (item.category == category) {
          filtered.add(item);
        };
      }
    );
    filtered.toArray();
  };

  // Reviews
  type Review = {
    id : Nat;
    clientName : Text;
    clientProfileBlobId : ?Text;
    reviewText : Text;
    rating : Nat;
    serviceId : ?Nat;
    createdAt : Int;
  };

  module Review {
    public func compare(review1 : Review, review2 : Review) : Order.Order {
      Nat.compare(review2.rating, review1.rating);
    };
  };

  let reviews = Map.empty<Nat, Review>();
  var nextReviewId = 1;

  public shared ({ caller }) func createReview(clientName : Text, clientProfileBlobId : ?Text, reviewText : Text, rating : Nat, serviceId : ?Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create reviews");
    };
    let id = nextReviewId;
    let review : Review = {
      id;
      clientName;
      clientProfileBlobId;
      reviewText;
      rating;
      serviceId;
      createdAt = Time.now();
    };
    reviews.add(id, review);
    nextReviewId += 1;
    id;
  };

  public shared ({ caller }) func updateReview(id : Nat, clientName : Text, clientProfileBlobId : ?Text, reviewText : Text, rating : Nat, serviceId : ?Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update reviews");
    };
    switch (reviews.get(id)) {
      case (null) { Runtime.trap("Review not found") };
      case (?existingReview) {
        let updatedReview : Review = {
          id;
          clientName;
          clientProfileBlobId;
          reviewText;
          rating;
          serviceId;
          createdAt = existingReview.createdAt;
        };
        reviews.add(id, updatedReview);
      };
    };
  };

  public shared ({ caller }) func deleteReview(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete reviews");
    };
    if (not reviews.containsKey(id)) {
      Runtime.trap("Review not found");
    };
    reviews.remove(id);
  };

  public query func listReviews() : async [Review] {
    reviews.values().toArray().sort<Review>();
  };

  // Contact Submissions
  type ContactSubmission = {
    id : Nat;
    name : Text;
    email : Text;
    projectDetails : Text;
    createdAt : Int;
    isRead : Bool;
  };

  module ContactSubmission {
    public func compare(sub1 : ContactSubmission, sub2 : ContactSubmission) : Order.Order {
      Nat.compare(sub1.id, sub2.id);
    };
  };

  let contactSubmissions = Map.empty<Nat, ContactSubmission>();
  var nextContactId = 1;

  public shared func submitContact(name : Text, email : Text, projectDetails : Text) : async Nat {
    let id = nextContactId;
    let submission : ContactSubmission = {
      id;
      name;
      email;
      projectDetails;
      createdAt = Time.now();
      isRead = false;
    };
    contactSubmissions.add(id, submission);
    nextContactId += 1;
    id;
  };

  public shared ({ caller }) func markAsRead(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can mark submissions as read");
    };
    switch (contactSubmissions.get(id)) {
      case (null) { Runtime.trap("Submission not found") };
      case (?submission) {
        let updatedSubmission : ContactSubmission = {
          id = submission.id;
          name = submission.name;
          email = submission.email;
          projectDetails = submission.projectDetails;
          createdAt = submission.createdAt;
          isRead = true;
        };
        contactSubmissions.add(id, updatedSubmission);
      };
    };
  };

  public shared ({ caller }) func deleteSubmission(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete submissions");
    };
    if (not contactSubmissions.containsKey(id)) {
      Runtime.trap("Submission not found");
    };
    contactSubmissions.remove(id);
  };

  public query ({ caller }) func listSubmissions() : async [ContactSubmission] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list submissions");
    };
    contactSubmissions.values().toArray().sort<ContactSubmission>();
  };
};
