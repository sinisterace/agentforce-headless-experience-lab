import { LightningElement, wire } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import getExternalClientAppCount from "@salesforce/apex/AgentforceVibesHomeController.getExternalClientAppCount";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { getRecord } from "lightning/uiRecordApi";
import USER_ID from "@salesforce/user/Id";
import USER_NAME from "@salesforce/schema/User.Username";
import USER_EMAIL from "@salesforce/schema/User.Email";

// Workaround for missing schema field import
const USER_EMAIL_VERIFIED = {
  fieldApiName: "HasUserVerifiedEmail",
  objectApiName: "User"
};

export default class AgentforceVibesHome extends NavigationMixin(LightningElement) {
  userId = USER_ID;
  username = "";
  email = "";
  isUserEmailVerified = false;
  externalClientAppCount = 0;

  @wire(getRecord, {
    recordId: "$userId",
    fields: [USER_NAME, USER_EMAIL, USER_EMAIL_VERIFIED]
  })
  wiredUser({ error, data }) {
    if (data) {
      this.username = data.fields.Username.value;
      this.email = data.fields.Email.value;
      this.isUserEmailVerified = data.fields.HasUserVerifiedEmail.value;
    } else if (error) {
      console.error("Error loading user record:", error);
    }
  }

  @wire(getExternalClientAppCount)
  wiredExternalClientAppCount({ data, error }) {
    if (data !== undefined) {
      this.externalClientAppCount = data;
    } else if (error) {
      console.error("Error fetching External Client App count:", error);
    }
  }

  // Open the "Agentforce Interfaces" Lightning app (CltCatalogue uiBundle). Uses a
  // standard__app page reference so the platform resolves the correct URL for THIS
  // org — never hardcode the domain (it differs per templated/orgfarm org).
  openInterfaces() {
    this[NavigationMixin.Navigate]({
      type: "standard__app",
      attributes: {
        appTarget: "c__CltCatalogue"
      }
    });
  }

  handleCopy(event) {
    const text = event.currentTarget.dataset.content;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Success",
            message: "Text copied to clipboard",
            variant: "success"
          })
        );
      })
      .catch((error) => {
        console.error("Failed to copy text: ", error);
      });
  }

  get hasExternalClientApp() {
    return this.externalClientAppCount > 0;
  }
}