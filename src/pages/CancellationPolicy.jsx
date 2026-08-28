import LegalPage from '../components/LegalPage'

const sections = [
  {
    heading: '1. Overview',
    paragraphs: [
      'We understand that plans can change. This policy explains how and when you can cancel or modify an order placed on Zivdah.',
    ],
  },
  {
    heading: '2. Cancellation Window',
    paragraphs: [
      'Orders can be cancelled or modified free of charge within 30 minutes of being placed, as long as the order has not yet been packed for dispatch. Once this window has passed, or once the order has been packed, it can no longer be cancelled through the app or website.',
    ],
  },
  {
    heading: '3. How to Cancel an Order',
    paragraphs: ['You can cancel an eligible order in any of the following ways:'],
    list: [
      'Go to "My Orders" in your account, select the order, and tap "Cancel Order".',
      'Call our support team at (022) 44830442.',
      'Email us at contact@zivdahonlinegrocery.com with your order ID.',
    ],
  },
  {
    heading: '4. Cancellations After Dispatch',
    paragraphs: [
      'Once an order has been packed or is out for delivery, it cannot be cancelled from the app. You may refuse delivery at the door; in this case, the order will be treated as a return and is subject to inspection before a refund is processed. Perishable items that are found tampered with or spoiled on refusal may not be eligible for a refund.',
    ],
  },
  {
    heading: '5. Order Modifications',
    paragraphs: [
      'Changes to items, quantities, or the delivery address can be made within the same 30-minute window as cancellations. After this, please cancel the order (if still eligible) and place a new one, or contact support for assistance.',
    ],
  },
  {
    heading: '6. Refunds for Cancelled Orders',
    list: [
      'Prepaid orders (UPI/Card/Netbanking): the full amount is refunded to the original payment method within 5–7 business days, or instantly as Zivdah Wallet credit if preferred.',
      'Cash on Delivery orders: no charge is made, as payment had not yet been collected.',
    ],
  },
  {
    heading: '7. Contact Us',
    paragraphs: ['For help with cancelling or modifying an order, reach out to us:'],
    list: [
      'Address: Unit 305, Kuber Complex, New Link Road, Opp to Laxmi Industrial Estate, Andheri West, Mumbai-400053',
      'Phone: (022) 44830442',
      'Email: contact@zivdahonlinegrocery.com',
    ],
  },
]

export default function CancellationPolicy() {
  return (
    <LegalPage
      title="Cancellation Policy"
      updated="August 28, 2026"
      intro="This policy explains the window in which you can cancel or modify an order on Zivdah, and what happens to your payment when you do."
      sections={sections}
    />
  )
}
