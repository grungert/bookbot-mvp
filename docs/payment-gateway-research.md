# Payment Gateway Research for Montenegro & Balkans

> Research conducted: January 2026

## Overview

This document covers online payment gateway options for businesses based in Montenegro looking to expand across the Balkan region (Serbia, Croatia, Bosnia & Herzegovina, Slovenia).

**Key constraint**: PayPal is not fully available in Montenegro, and Stripe does not officially support Montenegro or Serbia.

---

## Recommended Provider: Monri/WSPay

**Website**: https://www.wspay.me/ | https://monri.com/

### Why Monri?

- Native support for Montenegro + Serbia + rest of Balkans + EU
- Award-winning: Best payment integrator in Serbia (2024)
- Good documentation and SDKs
- Supports cards + Google Pay + PayPal
- Reasonable pricing
- Part of Payten/Asseco SEE group (established since 2009)

### Coverage

- Montenegro (primary)
- Serbia
- Croatia
- Slovenia
- Bosnia & Herzegovina
- EU markets

### Supported Payment Methods

**Credit/Debit Cards:**
- Visa
- Mastercard
- Maestro
- American Express
- Diners Club
- Discover

**Digital Wallets:**
- Google Pay
- PayPal
- Aircash
- Keks Pay
- Paycek

### Integration Options

| Method | Description |
|--------|-------------|
| Monri Components | Embedded form - customer stays on your page |
| Redirect Form | Customer transferred to Monri secure page |
| iFrame/Pop-up | Payment form in overlay |
| Android SDK | Native mobile integration |
| iOS SDK | Native mobile integration |
| Pre-built plugins | WooCommerce, PrestaShop, Magento, WordPress |

### Pricing

- **Minimum monthly fee**: EUR 36 OR 0.5% per transaction
- **Annual fee**: EUR 380
- **Integration & testing**: Free

### Security & Compliance

- PCI DSS Level 1 certified
- PSD2 compliant
- 3D Secure 2.0 (Visa Secure, Mastercard Identity Check, SafeKey)
- Tokenization for one-click payments

### Key Features

- Installment payments through partner banks
- Payment links (for email, social media, phone orders)
- Tokenization (one-click shopping)
- Promotional tools (discounts by product, amount, payment method)
- Transaction dashboard with reporting
- Multi-device access

### Documentation & Resources

- **Main docs**: https://ipg.monri.com/en/documentation
- **Integration guide**: https://monri.com/integration-online/
- **iOS SDK**: https://github.com/MonriPayments/monri-ios
- **Support**: support@monri.com

### Partner Banks in Montenegro

- CKB Banka
- Hipotekarna Banka
- NLB Banka

---

## Requirements for Merchant Account

### Business vs Personal Account

**You need a business/company account, NOT a personal account.**

Payment processors require:
- **Registered Business** — Legal entity (d.o.o., preduzetnik, etc.)
- **Business Bank Account** — Funds are deposited to business account only
- **Merchant Agreement** — Contract between your company and payment processor

### Why Personal Account Won't Work

- Payment processors are regulated (PCI DSS, anti-money laundering)
- They need to verify business legitimacy
- Tax reporting requires business documentation
- Banks won't issue merchant accounts to individuals

### How It Works (Example: NLB Bank + Monri)

```
Customer pays → Monri processes → Funds deposited to NLB business account
```

Since NLB is a Monri/WSPay partner bank in Montenegro, the integration is straightforward.

### Steps to Get Started

1. **Register a company** in Montenegro (d.o.o. or preduzetnik)
2. **Open a business account** at a partner bank (NLB, CKB, Hipotekarna)
3. **Contact Monri/WSPay** — they coordinate with your bank for merchant agreement
4. **Sign merchant agreement** — terms, fees, compliance requirements
5. **Get API credentials** — sandbox first, then production
6. **Integrate** payment gateway into your application

### Required Documents (Typical)

- Business registration certificate
- Tax ID (PIB)
- ID of company owner/director
- Bank account confirmation
- Website/app URL where payments will be processed
- Business description and expected transaction volumes

### Tip

Contact your bank (e.g., NLB Montenegro) and ask about their **e-commerce/merchant services** — they often have package deals with Monri/WSPay since they're partners.

---

## Other Providers Evaluated

### PrestoPay (prestopay.me)

**Verdict**: NOT suitable for e-commerce

- Consumer mobile banking app (like Revolut)
- Users link bank accounts, pay bills, P2P transfers
- Has "Presto Link" for businesses but limited documentation
- First PSD2-licensed payment institution in Montenegro
- Contact: hello@prestopay.me

### AllSecure

**Website**: https://www.allsecure.rs/en/

- Global payment gateway covering 180+ countries
- PCI compliant with fraud prevention
- Covers Montenegro, Serbia, Albania, Kosovo, North Macedonia, Bosnia
- Good for international reach beyond Balkans

### 2Checkout (Verifone)

**Website**: https://www.2checkout.com/

- Available in 200+ countries
- 40+ payment methods
- Good fallback if Monri doesn't work out
- Some merchants report rejection issues in Serbia

### PaySpot ME

**Website**: https://www.payspot.me/

- First payment institution in Montenegro
- Focus on POS terminals and agent network
- Better for physical retail locations
- Partner banks: Addiko Bank, Hipotekarna Banka, Lovćen Banka

---

## Providers NOT Available

### Stripe

- **Status**: Not supported in Montenegro or Serbia
- **Workaround**: Form a US LLC or UK company
- More info: https://incorpuk.com/blog/how-to-open-stripe-account-in-montenegro/

### PayPal (Merchant Accounts)

- Limited functionality in Montenegro
- Note: WSPay/Monri offers PayPal as a payment method through their gateway

---

## Regional Context

### SEPA Membership

- **Montenegro**: Joined SEPA in November 2024 (first Balkans country!)
- **Serbia**: Joining SEPA in May 2026

This enables cheap and fast EUR transfers across the EU.

### E-Commerce Trends in Western Balkans

- Combined population: 17.1 million
- E-commerce turnover: ~EUR 3.3 billion (2025)
- **72.5% of merchants** still use Cash on Delivery (COD)
- Digital wallet adoption growing (Google Pay, Apple Pay via local banks)
- BNPL (Buy Now, Pay Later) emerging but limited

### Local Payment Methods

**Serbia:**
- DinaCard (domestic card scheme by National Bank of Serbia)
- BanqUp (AIK Bank)
- Settle

**Montenegro:**
- Erste Wallet
- CKB GO Wallet

---

## Implementation Recommendation

1. **Primary**: Integrate Monri/WSPay for card payments
2. **Consider**: Adding Cash on Delivery option for Balkan customers
3. **Future**: Monitor Stripe availability as region develops

### Next Steps

1. Contact Monri at support@monri.com
2. Request API credentials and sandbox access
3. Review integration documentation
4. Implement using their Components SDK (recommended for UX)

---

## Sources

- [NORBr - Payment Methods in Western Balkans](https://norbr.com/library/payworldtour/payment-methods-in-western-balkans/)
- [Monri Online Payments](https://monri.com/products/online-payments/)
- [Monri Documentation](https://ipg.monri.com/en/documentation)
- [Stripe Global Availability](https://stripe.com/global)
- [Balkan eCommerce Summit 2026](https://balkanecommerce.com/)
- [Shopify Payment Gateways - Montenegro](https://www.shopify.com/payment-gateways/montenegro)
- [World Bank - Western Balkans Payment Systems](https://www.worldbank.org/en/region/eca/brief/advancing-the-modernization-and-integration-of-payment-systems-in-the-western-balkans)
