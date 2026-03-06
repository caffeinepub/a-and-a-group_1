import Map "mo:core/Map";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import List "mo:core/List";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Mixins
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Services
  type Service = {
    id : Nat;
    title : Text;
    description : Text;
    icon : Text;
    category : Text;
    rating : Float;
    isAvailable : Bool;
  };

  module Service {
    public func compare(service1 : Service, service2 : Service) : Order.Order {
      Nat.compare(service1.id, service2.id);
    };
  };

  let services = Map.empty<Nat, Service>();
  var nextServiceId = 1;

  public shared ({ caller }) func createService(title : Text, description : Text, icon : Text, category : Text, rating : Float) : async Nat {
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

  public shared ({ caller }) func updateService(id : Nat, title : Text, description : Text, icon : Text, category : Text, rating : Float) : async () {
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
    services.values().toArray().sort();
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
    portfolio.values().toArray().sort();
  };

  public query func filterPortfolioByCategory(category : Text) : async [PortfolioItem] {
    let filtered = List.empty<PortfolioItem>();
    portfolio.entries().forEach(
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
      Int.compare(review2.createdAt, review1.createdAt);
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
    reviews.values().toArray().sort();
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
      Int.compare(sub2.createdAt, sub1.createdAt);
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
    contactSubmissions.values().toArray().sort();
  };
};
