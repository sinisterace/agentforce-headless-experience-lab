@IsTest
private class CompanyBrandControllerTest {

    @IsTest
    static void returnsFullBrandFeed() {
        insert new Company_Knowledge__c(
            Name = 'K', Company_Name__c = 'Acme Co', Accent_Color__c = '#0F766E',
            Logo_Url__c = 'https://logo.clearbit.com/acme.com', Website__c = 'https://acme.com',
            Summary__c = 'Acme sells outdoor gear.',
            Signals_JSON__c = '["Eco-friendly","Repairs","Store pickup"]',
            Faq_Json__c = '[{"q":"Hours?","a":"24/7"},{"q":"Returns?","a":"60 days"},{"q":"","a":"drop me"}]',
            Faq_Content__c = 'x', Is_Active__c = true);
        Test.startTest();
        CompanyBrandController.Brand b = CompanyBrandController.getActiveBrand();
        Test.stopTest();

        System.assertEquals(true, b.found);
        System.assertEquals('Acme Co', b.companyName);
        System.assertEquals('#0F766E', b.accentColor);
        System.assertEquals('https://acme.com', b.website);
        System.assertEquals('Acme sells outdoor gear.', b.summary);
        System.assertEquals(3, b.signals.size(), 'signals parsed');
        System.assertEquals('Eco-friendly', b.signals[0]);
        System.assertEquals(2, b.faqs.size(), 'blank FAQ pair dropped');
        System.assertEquals('Hours?', b.faqs[0].question);
        System.assertEquals('24/7', b.faqs[0].answer);
    }

    @IsTest
    static void safeDefaultsWhenNone() {
        Test.startTest();
        CompanyBrandController.Brand b = CompanyBrandController.getActiveBrand();
        Test.stopTest();
        System.assertEquals(false, b.found);
        System.assertEquals('Your Company', b.companyName);
        System.assertEquals('#0B5CAB', b.accentColor);
        System.assertEquals(0, b.signals.size());
        System.assertEquals(0, b.faqs.size());
    }

    @IsTest
    static void readableByGuestReadPermSetUser() {
        // Regression guard for the Experience-site GUEST read — the bug that once left the public
        // site on "Your Company" while the agent answered correctly. A user whose ONLY grant on
        // Company_Knowledge__c is the guest-safe `Company_Knowledge_Guest_Read` permission set must
        // read the active brand. Locks in the object-read permset + the controller's
        // without-sharing / system-mode read together. Would FAIL if the permset lost object read
        // or the controller reverted to `with sharing`.
        User u = minimalUser();
        System.runAs(new User(Id = UserInfo.getUserId())) {   // isolate setup (User/PSA) DML
            insert u;
            PermissionSet ps = [SELECT Id FROM PermissionSet WHERE Name = 'Company_Knowledge_Guest_Read' LIMIT 1];
            insert new PermissionSetAssignment(AssigneeId = u.Id, PermissionSetId = ps.Id);
        }
        insert new Company_Knowledge__c(
            Name = 'K', Company_Name__c = 'Acme Co', Accent_Color__c = '#0F766E', Is_Active__c = true);

        CompanyBrandController.Brand b;
        Test.startTest();
        System.runAs(u) {
            b = CompanyBrandController.getActiveBrand();
        }
        Test.stopTest();

        System.assertEquals(true, b.found, 'A user granted only Company_Knowledge_Guest_Read must read the active brand');
        System.assertEquals('Acme Co', b.companyName);
    }

    // NOTE: guest RECORD visibility (the sharingRules/Company_Knowledge__c guest sharing rule that
    // shares Is_Active__c=true records to the site guest user) cannot be asserted in an Apex test —
    // guest sharing rules are not evaluated against test-created records. It is verified live: the
    // active record shows a `Company_Knowledge__Share` row with RowCause=GuestRule, created ~1s
    // after each /deployAgent insert. The test above covers object/field visibility + the read.

    /** Minimum-access Salesforce-license user — its only Company_Knowledge__c grant is the permset under test. */
    static User minimalUser() {
        Profile p = [
            SELECT Id FROM Profile
            WHERE Name IN ('Minimum Access - Salesforce', 'Standard User')
            ORDER BY Name
            LIMIT 1
        ];
        String uniq = 'cltcatgr' + String.valueOf(System.now().getTime());
        return new User(
            FirstName = 'CLT', LastName = 'GuestRead', Alias = 'cltgr',
            Email = 'clt.guestread@example.com', Username = uniq + '@cltcat.test.invalid',
            ProfileId = p.Id, TimeZoneSidKey = 'America/Los_Angeles', LocaleSidKey = 'en_US',
            EmailEncodingKey = 'UTF-8', LanguageLocaleKey = 'en_US'
        );
    }

    @IsTest
    static void toleratesMalformedJson() {
        insert new Company_Knowledge__c(
            Name = 'K', Company_Name__c = 'Bad JSON Co',
            Signals_JSON__c = 'not-json', Faq_Json__c = '{{{', Is_Active__c = true);
        Test.startTest();
        CompanyBrandController.Brand b = CompanyBrandController.getActiveBrand();
        Test.stopTest();
        System.assertEquals('Bad JSON Co', b.companyName);
        System.assertEquals(0, b.signals.size(), 'malformed signals -> empty, no error');
        System.assertEquals(0, b.faqs.size(), 'malformed faqs -> empty, no error');
    }
}