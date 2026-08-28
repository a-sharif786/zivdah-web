import LegalPage from '../components/LegalPage'

const sections = [
  {
    heading: '1. Introduction',
    paragraphs: [
      'Zivdah Online Grocery ("Zivdah", "we", "us", or "our") respects your privacy and is committed to protecting the personal information you share with us. This Privacy Policy explains what information we collect, how we use it, and the choices you have.',
      'By using our website, mobile app, or any other Zivdah service, you agree to the collection and use of information in accordance with this policy.',
    ],
  },
  {
    heading: '2. Information We Collect',
    paragraphs: ['We collect the following types of information:'],
    list: [
      'Personal details you provide, such as name, email address, phone number, and delivery address.',
      'Payment information processed securely through our payment gateway partners (we do not store full card details).',
      'Order history, cart activity, and product preferences.',
      'Device and usage data, including IP address, browser type, and pages visited.',
      'Location data, when enabled, to show relevant delivery areas and estimated delivery times.',
    ],
  },
  {
    heading: '3. How We Use Your Information',
    paragraphs: ['We use the information we collect to:'],
    list: [
      'Process and deliver your orders.',
      'Communicate order updates, offers, and support responses.',
      'Improve our products, website, and app experience.',
      'Prevent fraud and ensure the security of our platform.',
      'Comply with legal and regulatory obligations.',
    ],
  },
  {
    heading: '4. Sharing of Information',
    paragraphs: [
      'We do not sell your personal information. We may share your information with trusted third parties strictly to operate our service, including delivery partners (to fulfil your order), payment gateway providers (to process payments securely), and government or regulatory authorities where required by law.',
    ],
  },
  {
    heading: '5. Cookies and Tracking',
    paragraphs: [
      'We use cookies and similar technologies to keep you signed in, remember your cart, and understand how our website is used so we can improve it. You can control cookies through your browser settings, though some features may not work correctly if cookies are disabled.',
    ],
  },
  {
    heading: '6. Data Security',
    paragraphs: [
      'We use industry-standard security measures, including encryption and access controls, to protect your personal information from unauthorized access, alteration, or disclosure. However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute security.',
    ],
  },
  {
    heading: '7. Your Rights and Choices',
    paragraphs: ['You have the right to:'],
    list: [
      'Access, update, or correct your personal information from your account settings.',
      'Request deletion of your account and associated data, subject to legal record-keeping requirements.',
      'Opt out of promotional emails and SMS communications at any time.',
    ],
  },
  {
    heading: "8. Children's Privacy",
    paragraphs: [
      'Our services are not directed at individuals under the age of 18. We do not knowingly collect personal information from children.',
    ],
  },
  {
    heading: '9. Changes to This Policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time. Any changes will be posted on this page with a revised "Last updated" date. Continued use of our services after changes take effect constitutes acceptance of the updated policy.',
    ],
  },
  {
    heading: '10. Contact Us',
    paragraphs: [
      'If you have any questions about this Privacy Policy or how we handle your data, please reach out to us:',
    ],
    list: [
      'Address: Unit 305, Kuber Complex, New Link Road, Opp to Laxmi Industrial Estate, Andheri West, Mumbai-400053',
      'Phone: (022) 44830442',
      'Email: contact@zivdahonlinegrocery.com',
    ],
  },
]

export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="August 28, 2026"
      intro="Your trust matters to us. This policy describes how Zivdah Online Grocery collects, uses, and protects your personal information when you use our website, app, and services."
      sections={sections}
    />
  )
}
