import LegalPage from '../components/LegalPage'

const sections = [
  {
    heading: '1. Overview',
    paragraphs: [
      'At Zivdah, we want you to be completely satisfied with your order. Because we deal in fresh groceries and perishable items, our refund and returns process is designed to be quick and simple so that any issues are resolved before the product loses freshness.',
    ],
  },
  {
    heading: '2. Eligibility for Returns & Refunds',
    paragraphs: ['You are eligible for a return, replacement, or refund if:'],
    list: [
      'The product delivered is damaged, spoiled, or expired.',
      'You received the wrong item or an incorrect quantity.',
      'An item from your order is missing.',
      'The product is significantly different from what was described or shown on the app/website.',
    ],
  },
  {
    heading: '3. Reporting a Problem',
    paragraphs: [
      'Because most of our products are perishable, please report any issue within 24 hours of delivery by contacting our support team with your order ID and, where possible, a photo of the item received. Claims raised after this window may not be eligible for a refund.',
    ],
  },
  {
    heading: '4. Non-Returnable Items',
    paragraphs: ['The following items cannot be returned once delivered in good condition:'],
    list: [
      'Perishable items (fruits, vegetables, dairy, meat, bakery items) that were accepted without reporting an issue at the time of delivery.',
      'Packaged food items that have been opened or used, unless found defective.',
      'Items purchased under special clearance or non-returnable promotional offers.',
    ],
  },
  {
    heading: '5. Refund Process',
    paragraphs: [
      'Once your return or refund request is reviewed and approved by our support team, we will process the refund to your original payment method, or as Zivdah wallet credit if you prefer a faster resolution.',
    ],
  },
  {
    heading: '6. Refund Timeline',
    list: [
      'Zivdah Wallet credit: processed instantly to within 24 hours of approval.',
      'UPI / Debit / Credit Card payments: 5–7 business days, depending on your bank.',
      'Cash on Delivery orders: refunded via bank transfer or Zivdah Wallet, as chosen by you.',
    ],
  },
  {
    heading: '7. How to Request a Return or Refund',
    paragraphs: ['You can request a return or refund through any of the following:'],
    list: [
      'Go to "My Orders" in your account and select "Report an Issue" against the relevant order.',
      'Call us at (022) 44830442.',
      'Email us at contact@zivdahonlinegrocery.com with your order ID and details of the issue.',
    ],
  },
  {
    heading: '8. Contact Us',
    paragraphs: ['For any questions about this Refund & Returns Policy, reach out to us:'],
    list: [
      'Address: Unit 305, Kuber Complex, New Link Road, Opp to Laxmi Industrial Estate, Andheri West, Mumbai-400053',
      'Phone: (022) 44830442',
      'Email: contact@zivdahonlinegrocery.com',
    ],
  },
]

export default function RefundPolicy() {
  return (
    <LegalPage
      title="Refund & Returns Policy"
      updated="August 28, 2026"
      intro="This policy explains when you can return a product, request a replacement, or get a refund for orders placed on Zivdah, and how long the process takes."
      sections={sections}
    />
  )
}
