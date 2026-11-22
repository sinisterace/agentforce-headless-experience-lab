public with sharing class AgentforceVibesHomeController {

    @AuraEnabled(cacheable=true)
    public static Integer getExternalClientAppCount() {
        return [SELECT COUNT() FROM ExternalClientApplication];
    }
}