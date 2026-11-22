// Idempotent seed for the four ASA Legal catalogue rows (client-facing, law-firm
// website). Each row is matched on Industry_Key__c + Capability_Key__c, so
// re-running only updates in place. dto === the widget registry key / CltKind.
// NOTE: use a LITERAL & in these JSON strings (JSON, not XML); ASCII only.
//
// PREREQUISITE: 'legal' must exist on the CLT_Catalog_Item__c.Industry_Key__c
// restricted picklist before this runs (deploy the field change first). It is
// already in ConsultationCatalogService.INDUSTRY_KEYS (label "Legal") + shared.tsx
// (Gavel icon + industry-legal.png artwork).

// 1 — Practice-Area Selector
String paPayload = '{"title":"How can we help?","subtitle":"Tap an area to see how we can help - then start your conversation","areas":['
  + '{"id":"injury","name":"Personal Injury","blurb":"Accidents, negligence & claims","icon":"injury","description":"We pursue full compensation for accident and negligence victims - medical bills, lost wages, and pain and suffering. No fee unless we win.","services":["Car & truck accidents","Slip & fall","Medical malpractice","Wrongful death"],"stat":"$50M+ recovered","href":"/practice-areas/personal-injury"},'
  + '{"id":"family","name":"Family Law","blurb":"Divorce, custody & support","icon":"family","description":"Compassionate guidance through divorce, custody, and support - protecting your family and your future at every step.","services":["Divorce","Child custody","Child & spousal support","Prenuptial agreements"],"stat":"1,200+ families helped","href":"/practice-areas/family-law"},'
  + '{"id":"estate","name":"Estate Planning","blurb":"Wills, trusts & probate","icon":"estate","description":"Plan ahead with wills, trusts, and powers of attorney so your wishes are honored and your loved ones are protected.","services":["Wills","Living trusts","Probate","Power of attorney"],"stat":"Flat-fee packages","href":"/practice-areas/estate-planning"},'
  + '{"id":"business","name":"Business & Corporate","blurb":"Formation, contracts & disputes","icon":"business","description":"From formation to contracts to disputes, we help businesses operate and grow with confidence.","services":["Entity formation","Contracts","Partnership disputes","M&A"],"stat":"500+ businesses advised","href":"/practice-areas/business-law"},'
  + '{"id":"immigration","name":"Immigration","blurb":"Visas, green cards & citizenship","icon":"immigration","description":"Guiding individuals, families, and employers through visas, green cards, and citizenship.","services":["Family visas","Work visas","Green cards","Naturalization"],"stat":"98% approval rate","href":"/practice-areas/immigration"},'
  + '{"id":"criminal","name":"Criminal Defense","blurb":"Charges, DUI & expungement","icon":"criminal","description":"Aggressive, confidential defense against charges - protecting your rights, your record, and your freedom.","services":["DUI / DWI","Drug charges","Assault","Expungement"],"stat":"Available 24/7","href":"/practice-areas/criminal-defense"},'
  + '{"id":"employment","name":"Employment","blurb":"Disputes, contracts & rights","icon":"employment","description":"Standing up for employees and advising employers on workplace rights and compliance.","services":["Wrongful termination","Discrimination","Wage & hour","Severance review"],"stat":"Free consultation","href":"/practice-areas/employment-law"},'
  + '{"id":"realestate","name":"Real Estate","blurb":"Purchases, leases & closings","icon":"realestate","description":"Smooth closings and sound advice for buyers, sellers, landlords, and investors.","services":["Purchases & sales","Leases","Title review","Zoning & disputes"],"stat":"2,000+ closings","href":"/practice-areas/real-estate"}'
  + '],"linkText":"Learn more","submitText":"Get help with {name}","submitValue":"I need help with"}';

// 2 — Free Case Evaluation
String cePayload = '{"title":"Free case review","subtitle":"Tell us a little and we\'ll assess your options","matter":"Personal Injury","questions":['
  + '{"id":"when","label":"When did this happen?","type":"choice","options":["Past week","Past month","1-6 months ago","Over 6 months ago"]},'
  + '{"id":"injured","label":"Was anyone injured?","type":"choice","options":["Yes","No","Not sure"]},'
  + '{"id":"represented","label":"Have you hired a lawyer for this?","type":"choice","options":["No","Yes"]}'
  + '],"describeLabel":"Briefly describe your situation","describePlaceholder":"Share what happened, in your own words.","consentText":"I agree to the Privacy Policy and Terms of Use.","disclaimer":"Submitting this form does not create an attorney-client relationship. Please do not share confidential or time-sensitive information until we have agreed to represent you.","footerNote":"An attorney will review your request and respond within 1 business day.","submitText":"Request my free review","submitValue":"I would like a free case review"}';

// 3 — Meet Your Attorney (photo keys map to bundled headshots in the editor)
String amPayload = '{"title":"Meet your attorney","subtitle":"Matched to your matter - book a free consult","attorneys":['
  + '{"id":"vale","name":"Marcus Vale","title":"Managing Partner","focus":"Personal Injury & Litigation","photo":"lawyer-1","years":22,"rating":4.9,"casesWon":"500+ cases","bar":"CA #148203","blurb":"Trial-tested advocate for serious injury and negligence claims."},'
  + '{"id":"tanaka","name":"Kenji Tanaka","title":"Associate","focus":"Business & Immigration","photo":"lawyer-2","years":8,"rating":4.8,"casesWon":"120+ matters","bar":"CA #276514","blurb":"Guides founders and families through formation, contracts and visas."},'
  + '{"id":"shaw","name":"Eleanor Shaw","title":"Partner","focus":"Family & Estate Planning","photo":"lawyer-3","years":25,"rating":5.0,"casesWon":"600+ cases","bar":"CA #093117","blurb":"Compassionate counsel for divorce, custody, wills and trusts."}'
  + '],"submitText":"Book a consult","submitValue":"I would like to book with"}';

// 4 — Consultation Scheduler
String csPayload = '{"title":"Book your free consultation","attorneyName":"Marcus Vale","attorneyTitle":"Managing Partner - Personal Injury","attorneyPhoto":"lawyer-1","modes":['
  + '{"id":"in_person","label":"In person","icon":"in_person"},'
  + '{"id":"phone","label":"Phone","icon":"phone"},'
  + '{"id":"video","label":"Video","icon":"video"}'
  + '],"days":['
  + '{"id":"mon","label":"Mon","sublabel":"Sep 21","slots":[{"id":"m1","label":"9:00 AM"},{"id":"m2","label":"11:30 AM"},{"id":"m3","label":"2:00 PM"}]},'
  + '{"id":"tue","label":"Tue","sublabel":"Sep 22","slots":[{"id":"t1","label":"10:00 AM"},{"id":"t2","label":"1:00 PM","disabled":true},{"id":"t3","label":"3:30 PM"}]},'
  + '{"id":"wed","label":"Wed","sublabel":"Sep 23","slots":[{"id":"w1","label":"9:30 AM"},{"id":"w2","label":"12:00 PM"},{"id":"w3","label":"4:00 PM"}]},'
  + '{"id":"thu","label":"Thu","sublabel":"Sep 24","slots":[{"id":"h1","label":"11:00 AM"},{"id":"h2","label":"2:30 PM"}]},'
  + '{"id":"fri","label":"Fri","sublabel":"Sep 25","slots":[{"id":"f1","label":"9:00 AM"},{"id":"f2","label":"10:30 AM"},{"id":"f3","label":"1:30 PM"}]}'
  + '],"note":"Free 30-minute consultation - no obligation","submitText":"Confirm consultation","submitValue":"I would like to book"}';

Map<String, Map<String, String>> desired = new Map<String, Map<String, String>>{
  'practice_areas' => new Map<String, String>{
    'clt' => 'asaLegalPracticeAreas', 'dto' => 'legalPracticeAreasJSON',
    'label' => 'Practice-Area Selector',
    'desc' => 'Let a law-firm website visitor explore the areas of law the firm handles (personal injury, family, estate, business, immigration, criminal, employment, real estate) as expandable rows that reveal a description, common matter types, a trust stat, and a deep link, then route the conversation.',
    'payload' => paPayload
  },
  'case_evaluation' => new Map<String, String>{
    'clt' => 'asaLegalCaseEvaluation', 'dto' => 'legalCaseEvaluationJSON',
    'label' => 'Free Case Evaluation',
    'desc' => 'Collect a short, guided free case review from the visitor (a few quick questions, a description, and contact details) with a clear note that submitting does not create an attorney-client relationship, and hand the intake to the firm.',
    'payload' => cePayload
  },
  'attorney_match' => new Map<String, String>{
    'clt' => 'asaLegalAttorneyMatch', 'dto' => 'legalAttorneyMatchJSON',
    'label' => 'Meet Your Attorney',
    'desc' => 'Show attorneys matched to the visitor\'s matter as cards with focus, experience, rating and bar number, to build trust and let them pick one to book with.',
    'payload' => amPayload
  },
  'consultation' => new Map<String, String>{
    'clt' => 'asaLegalConsultScheduler', 'dto' => 'legalConsultSchedulerJSON',
    'label' => 'Consultation Scheduler',
    'desc' => 'Let the visitor book a free consultation by choosing a meeting type (in person, phone, video), a day, and a time slot.',
    'payload' => csPayload
  }
};
List<String> orderedCaps = new List<String>{ 'attorney_match', 'practice_areas', 'case_evaluation', 'consultation' };

Map<String, CLT_Catalog_Item__c> byCap = new Map<String, CLT_Catalog_Item__c>();
for (CLT_Catalog_Item__c c : [
  SELECT Id, Capability_Key__c FROM CLT_Catalog_Item__c WHERE Industry_Key__c = 'legal'
]) {
  byCap.put(c.Capability_Key__c, c);
}

List<CLT_Catalog_Item__c> toUpsert = new List<CLT_Catalog_Item__c>();
Integer order = 1;
for (String cap : orderedCaps) {
  Map<String, String> d = desired.get(cap);
  CLT_Catalog_Item__c row = byCap.containsKey(cap) ? byCap.get(cap) : new CLT_Catalog_Item__c();
  row.Industry_Key__c = 'legal';
  row.Capability_Key__c = cap;
  row.CLT_Api_Name__c = d.get('clt');
  row.DTO_Field_Name__c = d.get('dto');
  row.Display_Order__c = order;
  row.Label__c = d.get('label');
  row.Description__c = d.get('desc');
  row.Default_Payload_JSON__c = d.get('payload');
  toUpsert.add(row);
  order++;
}
upsert toUpsert;

System.debug('Seeded ' + toUpsert.size() + ' legal catalogue rows.');
for (CLT_Catalog_Item__c c : [
  SELECT Display_Order__c, Label__c, CLT_Api_Name__c, DTO_Field_Name__c
  FROM CLT_Catalog_Item__c WHERE Industry_Key__c = 'legal' ORDER BY Display_Order__c
]) {
  System.debug(c.Display_Order__c + ' | ' + c.Label__c + ' | ' + c.CLT_Api_Name__c + ' | ' + c.DTO_Field_Name__c);
}
