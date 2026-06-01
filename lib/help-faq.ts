import type { FaqItem } from "@/components/faq-accordion";

export const HELP_FAQ_ITEMS: FaqItem[] = [
  {
    question: "How do I create an account?",
    answer:
      "Select Sign up from the home page or login screen, enter your email and password, and confirm your account. Once signed in, you can bid, message sellers, and manage orders from your dashboard.",
  },
  {
    question: "How does bidding work?",
    answer:
      "Open a live auction listing and enter a bid at or above the minimum shown. Bids are binding commitments—if you win, you are expected to complete payment through the order checkout flow.",
  },
  {
    question: "What is a reserve price?",
    answer:
      "Some listings include a reserve price set by the seller. The auction may end without a sale if the highest bid does not meet the reserve. Reserve status is shown on the listing when applicable.",
  },
  {
    question: "What happens when I win an auction?",
    answer:
      "An order is created for the winning bid. You will see it under Orders → Purchases, where you can pay, track shipment, and confirm delivery when the item arrives.",
  },
  {
    question: "How do I pay for an order?",
    answer:
      "From your purchase order, open checkout and complete payment. Sellers can begin fulfillment only after payment is marked paid on the order.",
  },
  {
    question: "How does shipping and delivery work?",
    answer:
      "After payment, the seller prepares shipment, adds carrier and tracking, and marks the order shipped. You can view tracking on your order and confirm delivery once the item arrives.",
  },
  {
    question: "When can I leave a review?",
    answer:
      "Reviews are available after your order is paid and you have confirmed delivery. This helps keep feedback tied to completed transactions.",
  },
  {
    question: "How do I message a buyer or seller?",
    answer:
      "Use Message seller on a listing or Message buyer on an order to open a conversation in Messages. Keep communication on GoBidMe when coordinating orders.",
  },
  {
    question: "How do I report a listing?",
    answer:
      "On a listing page, use Report listing to submit a reason. Our moderation team reviews reports and may hide or cancel listings that violate marketplace rules.",
  },
  {
    question: "How do I contact support?",
    answer:
      "Email support@gobidme.com or use the Contact page form for general questions. Include your order ID for order-related issues.",
  },
];
