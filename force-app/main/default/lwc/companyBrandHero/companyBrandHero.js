import { LightningElement, track } from 'lwc';
import getActiveBrand from '@salesforce/apex/CompanyBrandController.getActiveBrand';

/**
 * Personalized support hub for the Experience site. Renders a branded nav, hero, "About",
 * highlight chips, and a Popular Questions accordion — all from the active Company_Knowledge__c
 * record at render time (no callout). The accent color drives every section via --brand-accent,
 * so the whole page re-colors per customer with no republish. Chat is handled by the separate
 * Embedded Messaging component (launcher in the corner), so there's no CTA button here.
 *
 * The brand is fetched IMPERATIVELY (not @wire) against a NON-cacheable Apex method on purpose:
 * the active company changes on every /cltcat/deployAgent run, and a cached response would leave
 * guest visitors on a stale company that no longer matches what the agent answers from. Reading
 * live on each page load keeps the hero and the agent in lockstep.
 */
export default class CompanyBrandHero extends LightningElement {
  brand;
  @track faqItems = [];
  @track faqQuery = '';

  connectedCallback() {
    this.loadBrand();
  }

  async loadBrand() {
    try {
      const data = await getActiveBrand();
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
    } catch (e) {
      // Leave the built-in "Your Company" defaults if the read fails.
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
  get faqResultLabel() {
    const total = this.faqItems.length;
    const shown = this.filteredFaqs.length;
    const noun = total === 1 ? 'question' : 'questions';
    if (this.faqQuery && this.faqQuery.trim()) {
      return `Showing ${shown} of ${total} ${noun}`;
    }
    return `${total} ${noun}`;
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
