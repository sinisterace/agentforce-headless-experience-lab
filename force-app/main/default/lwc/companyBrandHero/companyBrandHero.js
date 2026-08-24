import { LightningElement, wire, track } from 'lwc';
import getActiveBrand from '@salesforce/apex/CompanyBrandController.getActiveBrand';

/**
 * Personalized support hub for the Experience site. Renders a branded nav, hero, "About",
 * highlight chips, and a Popular Questions accordion — all from the active Company_Knowledge__c
 * record at render time (no callout). The accent color drives every section via --brand-accent,
 * so the whole page re-colors per customer with no republish. Chat is handled by the separate
 * Embedded Messaging component (launcher in the corner), so there's no CTA button here.
 */
export default class CompanyBrandHero extends LightningElement {
  brand;
  @track faqItems = [];
  @track faqQuery = '';

  @wire(getActiveBrand)
  wiredBrand({ data }) {
    if (data) {
      this.brand = data;
      this.faqItems = (data.faqs || []).map((f, i) => ({
        id: `faq-${i}`,
        question: f.question,
        answer: f.answer,
        open: false,
        itemClass: 'hub-faq-item',
      }));
    }
  }

  get companyName() {
    return (this.brand && this.brand.companyName) || 'Your Company';
  }
  get accent() {
    return (this.brand && this.brand.accentColor) || '#0B5CAB';
  }
  get logoUrl() {
    return this.brand && this.brand.logoUrl;
  }
  get hasLogo() {
    return !!(this.brand && this.brand.logoUrl);
  }
  get website() {
    return this.brand && this.brand.website;
  }
  get hasWebsite() {
    return !!(this.brand && this.brand.website);
  }
  get websiteLabel() {
    if (!this.website) return '';
    return this.website.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
  }
  get summary() {
    return this.brand && this.brand.summary;
  }
  get hasSummary() {
    return !!(this.brand && this.brand.summary);
  }
  get signals() {
    return (this.brand && this.brand.signals) || [];
  }
  get hasSignals() {
    return this.signals.length > 0;
  }
  get hasFaqs() {
    return this.faqItems.length > 0;
  }
  get rootStyle() {
    return `--brand-accent: ${this.accent};`;
  }
  get subtitle() {
    return `Welcome to ${this.companyName} support — find quick answers below, or chat with our AI assistant anytime.`;
  }
  get filteredFaqs() {
    const q = (this.faqQuery || '').trim().toLowerCase();
    if (!q) return this.faqItems;
    return this.faqItems.filter(
      (f) =>
        (f.question && f.question.toLowerCase().includes(q)) ||
        (f.answer && f.answer.toLowerCase().includes(q))
    );
  }
  get noResults() {
    return !!(this.faqQuery && this.faqQuery.trim()) && this.filteredFaqs.length === 0;
  }

  handleSearch(event) {
    this.faqQuery = event.target.value;
  }

  toggleFaq(event) {
    const id = event.currentTarget.dataset.id;
    this.faqItems = this.faqItems.map((f) => {
      if (f.id !== id) return f;
      const open = !f.open;
      return { ...f, open, itemClass: open ? 'hub-faq-item is-open' : 'hub-faq-item' };
    });
  }
}
