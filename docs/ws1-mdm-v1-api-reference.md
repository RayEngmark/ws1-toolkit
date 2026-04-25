# Workspace ONE UEM MDM REST API V1

> **Authoritative reference.** Pulled from `as2596.awmdm.com/API/help/Docs/Explore?urls.primaryName=MDM%20API%20V1#/RegistrationV1`.
> Source: tenant `as2596.awmdm.com` (production WS1 UEM API help page — auto-generated from running API).
>
> Base URL pattern: `https://{tenant}/api/mdm/...`
>
> When in doubt, this file overrules community code (PyVMwareAirWatch, third-party blogs, etc.). Verified field schemas still need to be checked against `/api/help` on the user's tenant.

-----

## AdminActionV1

- **POST** `/devices/admin-actions/{adminAction}` — Executes admin action for a set of devices

## AppleV1

- **GET** `/apple/remoteviewdestination` — list Remote View destinations
- **PUT** `/apple/remoteviewdestination` — update destination
- **POST** `/apple/remoteviewdestination` — add destination
- **GET** `/apple/remoteviewdestination/{id}` — get destination
- **DELETE** `/apple/remoteviewdestination/{id}` — delete destination

## Apps

- **GET** `/devices/{id}/apps` — apps installed on device by id
- **GET** `/devices/apps` — apps by alternate id
- **GET** `/devices/{id}/adminapps` — admin apps for device

## AppsV1

- **GET** `/devices/{deviceUuid}/apps/search` — apps applicable to a device
- **GET** `/devices/{deviceUuid}/apps` — app details for the device

## AssetsV1

- **POST** `/metadata-transforms/{organizationGroupUuid}/assets/platform/{platform}/payloads`
- **GET** `/metadata-transforms/{organizationGroupUuid}/assets/{assetUuid}`
- **GET** `/assets/search` — list latest version of assets
- **POST** `/assets/assignment-preview/summary`
- **POST** `/assets/assignment-preview/search` — search devices assigned to profiles

## AssignmentGroupsV1 / V2

- **GET** `/groups/{groupId}/assignmentgroups`
- **GET** `/groups/{organizationGroupUuid}/google-chrome-os-organizational-units` (V2)

## BitLockerV1

- **GET** `/devices/{deviceUuid}/bitlocker/drives`
- **GET** `/devices/{deviceUuid}/bitlocker/drives/{volumeIdentifier}/protectors`

## CatalogsV1 / Baseline / OSVersions / Platforms / Templates

(Compliance baseline policy catalog endpoints — out of scope for current toolkit but documented here for completeness.)

## Certificates

- **GET** `/devices/{id}/certificates` — by device id
- **GET** `/devices/certificates` — by alternate id

## ChromeOsV1

ChromeOS-specific configuration, device policies, sync, lost mode. Out of scope for current toolkit.

## CommandsV1

- **POST** `/devices/commands/containerpasscode`
- **POST** `/devices/commands/remoteview`
- **POST** `/devices/commands/requestdevicelog` — request device log
- **POST** `/devices/commands/stopdevicelog`
- **POST** `/devices/commands/bulk/scheduleosupdate` — bulk schedule OS update
- **POST** `/devices/commands/changeorganizationgroup` — by alternate ID
- **POST** `/devices/commands/scheduleosupdate` — single device OS update
- **POST** `/devices/{deviceid}/commands` — generic command for device by ID
- **POST** `/devices/commands` — generic command by alternate ID
- **PUT** `/devices/{deviceUuid}/commands/change-organization-group/{organizationGroupUuid}` — change OG via UUID (V1)
- **PUT** `/devices/{id}/commands/changeorganizationgroup/{organizationgroupid}` — change OG via numeric ID
- **POST** `/devices/{deviceId}/commands/finddevice`
- **POST** `/devices/commands/finddevice`
- **POST** `/devices/{id}/commands/changepasscode`
- **POST** `/devices/commands/changepasscode`
- **POST** `/devices/{deviceid}/commands/startairplay`
- **POST** `/devices/commands/bulk` — multi-device commands by alternate ID

> ⚠ **Discrepancy with current code**: our Rust backend uses **POST** for `changeorganizationgroup`. Spec says **PUT**. Community scripts use POST and it works in practice (likely both are accepted), but PUT is canonical.

## ComplianceConditionalAccessDeviceInformationReportingV1

- **GET** `/devices/{deviceUuid}/conditional-access-device-registration-information`

## CompliancePolicyV1

- **GET** `/compliancepolicies` — search compliance policies
- **GET** `/compliancepolicy/search`

## ComplianceV1

- **GET** `/devices/{deviceId}/compliance`
- **GET** `/devices/compliance`

## Contents

- **GET** `/devices/{id}/content`
- **GET** `/devices/content`

## DeploymentV1

Android OEM deployment status & search. Vendor-specific.

## DeviceAttributesV1

- **POST** `/devices/model-details` — load device model details for given manufacturers

## DeviceCustomAttributes

- **PUT** `/devices/customattributes` — bulk update of custom attributes
- **GET** `/devices/customattribute/search`
- **GET** `/devices/customattribute/changereport`
- **PUT** `/devices/{id}/customattributes` — by device id
- **DELETE** `/devices/{id}/customattributes`
- **PUT** `/devices/serialnumber/{serialnumber}/customattributes`
- **DELETE** `/devices/serialnumber/{serialnumber}/customattributes`
- **PUT** `/devices/assetnumber/{assetnumber}/customattributes`

## DeviceEnrollmentProgramV1 (DEP / Apple ADE)

- **GET** `/dep/profiles/search`
- **GET / PUT / DELETE** `/dep/profiles/{profileUuid}`
- **POST** `/dep/profiles`
- **GET** `/dep/certificates/{certId}`
- **POST** `/dep/certificates/{organizationGroupId}`
- **POST / DELETE** `/dep/accounts/{organizationGroupId}`
- **GET / PUT** `/dep/groups/{groupUuid}/devices`
- **PUT** `/dep/profiles/{profileUuid}/devices/{serialNumber}`
- **GET** `/dep/profiles/{profileUuid}/devices`

## DeviceLogV1

- **GET** `/devices/{deviceUuid}/sources/{sourceUuid}/logs`

## Devices

- **GET** `/devices` — by alternate id (uses `searchby` + `id` query params)
- **PUT** `/devices` — edit by alternate id
- **POST** `/devices` — multi-device info by id type
- **DELETE** `/devices` — delete by alternate id
- **GET / PUT / DELETE** `/devices/{id}` — by device id
- **GET** `/devices/{uuid}/tags` — tags on a device ✓
- **POST** `/devices/{device_uuid}/tags/{tag_uuid}` — single-device single-tag attach
- **DELETE** `/devices/{device_uuid}/tags/{tag_uuid}` — single-device single-tag detach
- **GET** `/devices/udid/{udid}` — direct lookup by UDID
- **GET** `/devices/litesearch` — slim device search
- **GET** `/devices/extensivesearch` — heavy/deep search
- **GET** `/devices/search` — standard search ✓
- **POST** `/devices/bulk` — bulk delete by id or alternate id
- **POST** `/devices/id` — multi-device info by id
- **GET** `/devices/{deviceUuid}/filesactions`
- **GET** `/devices/{deviceUuid}/eventactions`
- **POST** `/devices/managedsettings` — set iOS managed settings
- **GET** `/devices/bulksettings` — bulk action limits
- **GET** `/devices/devicecountinfo` — counts grouped by platform / enrollment / ownership
- **GET** `/devices/udid/{udid}/deviceenrollmentstatus`
- **POST** `/devices/serialnumber/{serialnumber}/sendmessage` — push or SMS by serial
- **POST** `/devices/enrolleddevicescount`
- **GET** `/ogs/{og_id}/devices/audit`
- **GET** `/devices/{deviceId}/loggedinusers`
- **GET** `/devices/appstatus`

## DeviceSamples

- **POST** `/DeviceSamples` — save device samples

## DeviceSensors / DeviceSensorsV1

Per-device telemetry sensors (custom attributes on steroids). Out of scope.

## DeviceSmartGroups / DeviceSmartGroupsV1

- **GET** `/devices/{id}/smartgroups` — smart groups a device belongs to
- **POST** `/devices/smartgroups` — query smart groups for a list of devices
- **POST** `/devices/smartgroups/device-map-diagnostics`

## DeviceStateMetadataV1 / DeviceWorkflowV1 / DirectEnrollmentSettingsV1

Device state metadata, workflows, direct enrollment settings.

## DropshipProvisioningActionsV1

- **POST** `/dropship-action/organization-group/{ogUuid}/sync-devices`

## DsmV1

- **POST** `/dsm/users/{userUuid}/devices/{deviceUuid}/overrides`

## EnrollmentToken (Actions / V1)

- **PUT / POST / DELETE** `/enrollment-tokens` — multi-token operations
- **PUT** `/enrollment-tokens/{ogUuid}/compliance-statuses/{enrollmentTokenUuid}`
- **GET / DELETE** `/groups/{ogUuid}/enrollment-tokens/{tokenUuid}`
- **GET** `/groups/{ogUuid}/enrollment-tokens` — list/search
- **POST** `/groups/{ogUuid}/enrollment-tokens` — create

## EventLog / GPS / Network

- **GET** `/devices/{id}/eventlog` and `/devices/eventlog`
- **GET** `/devices/{id}/gps`, `/devices/gps`, **POST** `/devices/gps`, `/devices/gps/search`
- **GET** `/devices/{id}/network`, `/devices/network`, `/devices/networkinfosearch`

## HubAgentPackagesV1

- **GET** `/product-components/hub-agent-packages/search`

## Launcher

- **POST** `/devices/{deviceUuid}/launcher/enter-admin-mode`
- **POST** `/devices/{deviceUuid}/launcher/exit-admin-mode`
- **POST** `/devices/{deviceUuid}/launcher/exit`

## LostModeV1

- **PUT** `/devices/{deviceUuid}/lostmode/{enableLostMode}`

## MessagesV1

- **POST** `/devices/{id}/messages/push|email|sms`
- **POST** `/devices/messages/push|email|sms` — by alternate id
- **POST** `/devices/messages/bulkpush|bulkemail|bulksms`
- **POST** `/devices/messages/{id}/message`, `/devices/messages/message`

## Notes

- **GET** `/devices/notes` — by alternate id
- **POST** `/devices/notes`
- **GET / PUT / DELETE** `/devices/notes/{noteid}`
- **GET** `/devices/{id}/notes`
- **GET / PUT / DELETE** `/devices/{deviceId}/notes/{noteId}`
- **POST** `/devices/{deviceId}/notes`

## OemEnrollmentTokenV1 / OemUpdates / OperatorTypeMap / OPSDeviceLastSync

OEM-specific device update endpoints + Rules Engine operator metadata.

## Peripherals

- **GET** `/peripherals/printer/{deviceID}`
- **GET** `/peripherals/printers/{organizationGroupID}`

## PickLists

100+ endpoints exposing dropdown enumerations (device categories, ownership types, OS versions, platform-specific values, etc.). Useful for UI dropdowns when building/editing profiles.

Examples:
- `/picklists/devicecategories`
- `/picklists/devicetypes`
- `/picklists/platforms/{platform}/operatingsystems`
- `/picklists/ownershiptypes`
- `/picklists/platforms/{platform}/devicemodels`
- `/picklists/organizationgroups/{ogid}/certificateauthorities`
- … (and many more, per-platform variants for Apple/iOS/macOS/Android/Windows)

## PoliciesV1

Android Update Policies — out of scope.

## ProductComponentsV1 / ProductSetV1 / ProductsV1

Workspace ONE Product Provisioning (rugged Android, Windows products). Large surface area; out of scope for current toolkit but documented.

## Profiles

- **GET** `/devices/{id}/profiles` ✓
- **GET** `/devices/profiles`
- **POST** `/devices/{id}/commands/installprofile` — alternate install path

## ProfilesV1

- **DELETE** `/profiles/{profileUuid}`
- `/profiles/search` — list profiles ✓
- **POST** `/profiles/{profileid}/remove` — remove profile from device(s) ✓
- **POST** `/profiles/{profileid}/activate`
- **POST** `/profiles/{profileUuid}/activate`
- **POST** `/profiles/{profileid}/deactivate`
- **POST** `/profiles/{profileUuid}/deactivate`
- **DELETE** `/profiles/{profileid}`
- **POST** `/profiles/uploadcertificate`
- **GET** `/profiles/sso/status`
- **POST** `/profiles/stagenow/barcode`
- **POST** `/profiles/certificate/upload/{profileUuid}`
- **GET / POST** `/profiles/certificatemap`
- **DELETE** `/profiles/certificatemap/{mappingID}`
- **POST** `/profiles/{profileid}/install` ✓ — install profile on device(s)
- **GET** `/profiles/{profileuuid}/devices` — list devices a profile is on
- **GET** `/profiles/{profileUuid}/summary` — count by status
- **GET** `/profiles/{profileUuid}/detail` — profile details

## RegistrationV1 / RelayServersV1 / RelayServersV2

Relay server management. Out of scope for current toolkit.

## RemoteManagementV1

- **GET** `/remote-management/devices/{deviceUuid}` — RM4 registration info
- **POST** `/remote-management/devices/{deviceUuid}` — register
- **POST** `/remote-management/devices/{deviceUuid}/session` — start RM session

## ResourcesV1

- **POST** `/resources/query`

## ScriptAssignmentV1 / ScriptsV1

- **GET / POST** `/scripts/{scriptUuid}/assignments` — manage script assignments
- **GET / POST** `/groups/{organizationGroupUuid}/scripts` — list/create scripts
- **GET / PUT** `/scripts/{scriptUuid}` — get/update
- **POST** `/groups/{organizationGroupUuid}/scripts/samples`
- **POST** `/groups/{organizationGroupUuid}/scripts/bulkdelete`
- **GET** `/{deviceUuid}/scripts/{scriptUuid}/definition`
- **GET** `/{deviceUuid}/scripts/{scriptUuid}/config/{configBundleUuid}`

## SecurityV1

- **GET** `/devices/{id}/security`
- **GET** `/devices/security`
- **GET** `/devices/securityinfosearch`
- **GET** `/devices/{uuid}/security/managed-admin-information` — macOS admin info
- **GET** `/devices/{uuid}/security/encryption-status`
- **GET** `/devices/{uuid}/security/recovery-lock-password` — macOS recovery lock pw

## SmartGroups

- **GET** `/smartgroups/{id}` — get details ✓
- **PUT** `/smartgroups/{id}` — update full SG details
- **DELETE** `/smartgroups/{id}` — delete SG
- **POST** `/smartgroups` — create new SG ✓ (we don't expose this yet — could add a Create Smart Group action)
- **GET** `/smartgroups/search` — search SGs ✓
- **GET** `/smartgroups/{smartgroupid}/devices` ✓
- **GET** `/smartgroups/{id}/apps` — apps assigned to SG

> ⚠ **Discrepancy**: our Rust client posts to `/smartgroups/{id}/update` (community pattern). The canonical endpoint is **PUT** `/smartgroups/{id}`. WS1 may accept both. Verify against the live tenant.

## StagingBundlesV1 / StagingV1

Android Work / staged enrollment.

## SyncV1

- **POST** `/android-oem-integration/sync/organization-groups/{organizationGroupUuid}/zebra`

## Tags

- **POST** `/tags/addtag` — create tag ✓
- **POST** `/tags/{tagId}/update` — update tag
- **DELETE** `/tags/{tagId}` — delete tag
- **GET** `/tags/{tagId}/devices` — devices with tag
- **POST** `/tags/{tagid}/adddevices` — bulk add devices to tag ✓
- **POST** `/tags/{tagid}/removedevices` — bulk remove ✓
- **GET** `/tags/search` — list/search tags

## TelecomDevices

- **GET** `/telecom/devices/usagehistory`
- **GET** `/telecom/devices/bulkusagehistory`

## ThirdPartyProviderIntegrationManagementV1

Vulnerability defense third-party integrations.

## TunnelAdminActionV1 / TunnelDiscoveryV1 / TunnelHealthV1 / TunnelStandaloneClientV1 / TunnelTrafficRulesV1 / TunnelUsersShift

Workspace ONE Tunnel — out of scope.

## UpdatesPolicyV1 / UpdatesV1

Device OS update orchestration.

## Users

- **GET** `/devices/{id}/user`
- **GET** `/devices/user`

## VulnerabilityInsightV1

CVE/vulnerability mapping per product, per device, per OG. Useful for security posture views.

## WorkflowDevicesExportV1 / WorkflowEntityV1 / WorkflowImportExportJobsV1 / WorkflowImportExportV1 / WorkflowStatusReporting

Freestyle workflow lifecycle endpoints.

-----

## Quick map: what we currently use vs the spec

| Action in app | Endpoint we call | Spec endpoint | Match? |
|---|---|---|---|
| Test connection | `GET /api/system/info` | (System API V1) | ✓ |
| Device search | `GET /api/mdm/devices/search?searchby=&id=` | `/devices/search` | ✓ |
| Device by id | `GET /api/mdm/devices/{id}` | `/devices/{id}` | ✓ |
| List tags | `GET /api/system/groups/{ogId}/tags` | (System API) — alt: `/api/mdm/tags/search` | ✓ |
| Add tags | `POST /api/mdm/tags/{id}/adddevices` | `/tags/{tagid}/adddevices` | ✓ |
| Remove tags | `POST /api/mdm/tags/{id}/removedevices` | `/tags/{tagid}/removedevices` | ✓ |
| Create tag | `POST /api/mdm/tags/addtag` | `/tags/addtag` | ✓ |
| Move OG | `POST /api/mdm/devices/{id}/commands/changeorganizationgroup/{ogid}` | `PUT` per spec | ⚠ HTTP verb mismatch |
| List profiles | `GET /api/mdm/profiles/search` | `/profiles/search` | ✓ |
| Install profile | `POST /api/mdm/profiles/{id}/install` body `{SerialNumber}` | `/profiles/{profileid}/install` | ✓ |
| Remove profile | `POST /api/mdm/profiles/{id}/remove` body `{SerialNumber}` | `/profiles/{profileid}/remove` | ✓ |
| List smart groups | `GET /api/mdm/smartgroups/search` | `/smartgroups/search` | ✓ |
| SG by id | `GET /api/mdm/smartgroups/{id}` | `/smartgroups/{id}` | ✓ |
| SG devices | `GET /api/mdm/smartgroups/{id}/devices` | `/smartgroups/{smartgroupid}/devices` | ✓ |
| SG add/remove devices | `POST /api/mdm/smartgroups/{id}/update` body `{DeviceAdditions/Exclusions}` | spec says **PUT** `/smartgroups/{id}` for update | ⚠ verb + path may differ |

## Action items based on this spec

1. Switch `move-OG` to **PUT** to match spec.
2. Verify smart group update — try PUT `/smartgroups/{id}` first, fall back to POST `/smartgroups/{id}/update`. Real-tenant test will tell us.
3. Optional: expose **Create Smart Group** (POST `/smartgroups`) and **Delete Smart Group** (DELETE `/smartgroups/{id}`) as new actions.
4. Optional new actions worth considering:
   - **Send message to device(s)** — `POST /devices/messages/{push|email|sms}` and bulk variants
   - **Device commands** — Lock, Wipe, Sync, Query (`POST /devices/{id}/commands` with command name)
   - **Set custom attribute** — `PUT /devices/{id}/customattributes` (bulk variant exists)
   - **Notes** — view / add / edit notes per device
5. **Picklist endpoints** are useful when adding profile-creation UIs (out of scope today).
