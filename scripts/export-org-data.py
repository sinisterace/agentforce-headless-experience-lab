#!/usr/bin/env python3
"""Export the demo's runtime data records from an org to CSV (backup / re-seed source).

Usage: python3 scripts/export-org-data.py <org-alias> <output-dir>

Exports every createable field (plus Id) of each object below via the Bulk API,
so the CSVs can be re-imported with `sf data import bulk` (drop the Id column and
remap lookups first). Read-only against the org.
"""
import json, os, subprocess, sys

OBJECTS = [
    # app-specific
    "CLT_Catalog_Item__c", "Company_Knowledge__c", "Onboarding_Profile__c", "FAQ__kav",
    # CRM demo data the live-SOQL CLTs (ecw*/asa*) read
    "Account", "Contact", "Opportunity", "Case", "Lead",
]
SKIP_TYPES = {"address", "location", "base64"}


def sf(*args):
    out = subprocess.run(["sf", *args, "--json"], capture_output=True, text=True)
    return json.loads(out.stdout or "{}")


def main(org, outdir):
    os.makedirs(outdir, exist_ok=True)
    for obj in OBJECTS:
        d = sf("sobject", "describe", "-s", obj, "-o", org).get("result")
        if not d:
            print(f"skip {obj}: not describable"); continue
        fields = ["Id"] + [f["name"] for f in d["fields"]
                           if f["createable"] and f["type"] not in SKIP_TYPES and f["name"] != "Id"]
        where = " WHERE PublishStatus = 'Online' AND Language = 'en_US'" if obj.endswith("__kav") else ""
        q = f"SELECT {', '.join(fields)} FROM {obj}{where}"
        path = os.path.join(outdir, f"{obj}.csv")
        r = sf("data", "export", "bulk", "-q", q, "--output-file", path,
               "--result-format", "csv", "-o", org, "--wait", "10")
        print(f"{obj}: {r.get('result', {}).get('totalSize', r.get('message', '?'))}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
