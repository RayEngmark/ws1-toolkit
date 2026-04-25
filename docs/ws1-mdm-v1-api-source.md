# Workspace ONE UEM MDM REST API V1

**Server:** `https://as2596.awmdm.com/api/mdm`
**Kilde:** `as2596.awmdm.com/API/help/Docs/Explore?urls.primaryName=MDM%20API%20V1#/RegistrationV1`

-----

## AdminActionV1

- **POST** `/devices/admin-actions/{adminAction}` — New - Executes the admin action for the set of devices after performing necessary checks like command accessibility, device enrollment status, support for command on device etc.

## AppleV1

- **GET** `/apple/remoteviewdestination` — New - Gets the list of Remote View destinations configured in the organization group
- **PUT** `/apple/remoteviewdestination` — New - Update the destination details of a previously configured Remote View destination
- **POST** `/apple/remoteviewdestination` — New - Add a destination for Remote View
- **GET** `/apple/remoteviewdestination/{id}` — New - Gets Remote View destination details for the device
- **DELETE** `/apple/remoteviewdestination/{id}` — New - Delete a Remote View destination for the device

## Apps

- **GET** `/devices/{id}/apps` — Retrieves application details of the device identified by device ID
- **GET** `/devices/apps` — Retrieves application details of the device identified by alternate id
- **GET** `/devices/{id}/adminapps` — Retrieves Admin applications details for passed DeviceID

## AppsV1

- **GET** `/devices/{deviceUuid}/apps/search` — New - Returns the apps which are applicable to the device
- **GET** `/devices/{deviceUuid}/apps` — New - Returns details for the specified app installed/assigned to the device

## AssetsV1

- **POST** `/metadata-transforms/{organizationGroupUuid}/assets/platform/{platform}/payloads` — New - Save asset metadata and payloads
- **GET** `/metadata-transforms/{organizationGroupUuid}/assets/{assetUuid}` — New - Gets the asset metadata for the specified asset uuid
- **GET** `/assets/search` — New - Gets the list of latest version of assets by applying the search criteria
- **POST** `/assets/assignment-preview/summary` — New - Get a summary of assignment preview devices for the given asset
- **POST** `/assets/assignment-preview/search` — Searches for devices assigned to the specified profiles

## AssignmentGroupsV1

- **GET** `/groups/{groupId}/assignmentgroups` — New - Returns a list of Assignment Groups matching the search criteria

## AssignmentGroupsV2

- **GET** `/groups/{organizationGroupUuid}/google-chrome-os-organizational-units` — New - Returns a list of Organizational Units matching the search criteria

## BitLockerV1

- **GET** `/devices/{deviceUuid}/bitlocker/drives` — Returns the Bit Locker drive level information for the device
- **GET** `/devices/{deviceUuid}/bitlocker/drives/{volumeIdentifier}/protectors` — Returns the Bit Locker protector information for the device

## CatalogsV1

- **GET** `/baselines/catalogs/{osVersionUUID}` — New - Fetch policy catalog for the given operating system version
- **GET** `/baselines/catalogs/{osVersionUUID}/policies` — New - Search policies in the Policy catalog of a specific version
- **GET** `/baselines/catalogs/policies/{policyUUID}` — New - Fetch a policy with it's options

## Certificates

- **GET** `/devices/{id}/certificates` — Retrieves certificate details of the device identified by device Id
- **GET** `/devices/certificates` — Retrieves certificate details of the device identified by the alternate Id's

## ChromeOsV1

- **GET** `/chromeos/devices/{deviceId}/policy` — New - Get the status of the update by returning the policy on the device
- **POST** `/chromeos/{groupId}/userPolicy` — New - Creates or Updates user policy for all the users in usergroups
- **GET** `/chromeos/configuration/{groupId}` — New - loads the ChromeBook Configuration Settings for an Organization Group
- **POST** `/chromeos/configuration/{groupId}` — New - Saves the ChromeBook Configuration Settings for an Organization Group
- **DELETE** `/chromeos/configuration/{groupId}` — New - Deletes the ChromeBook Configuration Settings for a Organization Group
- **POST** `/chromeos/{groupId}/devicePolicy` — New - Create a new Device Policy profile for the given organization Group
- **GET** `/chromeos/{groupId}/policy/{policyId}` — New - Retrieve the existing Policy profile
- **PUT** `/chromeos/{groupId}/policy/{policyId}` — New - Edit the existing Device Policy profile by creating a version of the settings
- **GET** `/chromeos/{groupId}/cloudprofile/{profileId}/profileType/{profileType}` — New - Get Metadata for loading device Policy cloud profile UI
- **POST** `/chromeos/{groupId}/devices/sync` — New - Executes device sync command for the given organization group
- **DELETE** `/chromeos/cloudprofile/{profileId}` — New - Deletes the Chrome OS Profile
- **PUT** `/chromeos/{deviceId}/lostmode/{isEnabled}` — New - Enable or disable the device lost mode

## CommandsV1

- **POST** `/devices/commands/containerpasscode` — New - Executes change passcode command for container device matching the filter criteria
- **POST** `/devices/commands/remoteview` — New - Executes start remoteview command for device matching the filter criteria
- **POST** `/devices/commands/requestdevicelog` — New - Executes device log request command for device matching the filter criteria
- **POST** `/devices/commands/stopdevicelog` — New - Executes stop device log request command for device
- **POST** `/devices/commands/bulk/scheduleosupdate` — New - Executes Schedule OS Update command for devices in bulk
- **POST** `/devices/commands/changeorganizationgroup` — New - Changes the organization group to which the device identified by the alternate ID is assigned
- **POST** `/devices/commands/scheduleosupdate` — New - Schedule OS Update for supervised DEP devices
- **POST** `/devices/{deviceid}/commands` — New - Executes commands for the specified device
- **POST** `/devices/commands` — New - Executes a command for device by alternate ID
- **PUT** `/devices/{deviceUuid}/commands/change-organization-group/{organizationGroupUuid}` — New - Changes the organization group to which the device is assigned via UUID
- **PUT** `/devices/{id}/commands/changeorganizationgroup/{organizationgroupid}` — Changes the organization group to which the device is assigned
- **POST** `/devices/{deviceId}/commands/finddevice` — Executes find device command for device by device id
- **POST** `/devices/commands/finddevice` — Executes finddevice command for device by alternate id
- **POST** `/devices/{id}/commands/changepasscode` — Executes change passcode command for device ID
- **POST** `/devices/commands/changepasscode` — Executes command for change passcode of device by alternate ID
- **POST** `/devices/{deviceid}/commands/startairplay` — Executes start airplay for a specific device
- **POST** `/devices/commands/bulk` — Executes command for multiple devices identified by alternate ID type

## ComplianceConditionalAccessDeviceInformationReportingV1

- **GET** `/devices/{deviceUuid}/conditional-access-device-registration-information` — New - Retrieve Conditional Access device registration information

## CompliancePolicyV1

- **GET** `/compliancepolicies` — New - Returns a collection of Compliance Policies based on the search criteria
- **GET** `/compliancepolicy/search` — Searches for the CompliancePolicies with the search parameters passed

## ComplianceV1

- **GET** `/devices/{deviceId}/compliance` — Retrieves compliance details of the device identified by device ID
- **GET** `/devices/compliance` — Retrieves compliance details of the device identified by the alternate id

## Contents

- **GET** `/devices/{id}/content` — Retrieves the content details of the device identified by device ID
- **GET** `/devices/content` — Retrieves the content details of the device identified by alternate ID

## DeploymentV1

- **GET** `/android-oem-integration/deployment/organization-groups/{organizationGroupUuid}/updates/{updatePolicyUuid}/status-summary` — New - Gets the deployment status summary for a given update policy
- **POST** `/android-oem-integration/deployment/organization-groups/{organizationGroupUuid}/updates/{updatePolicyUuid}/status-search` — New - Performs search on the device statuses for a given update policy
- **POST** `/android-oem-integration/deployment/organization-groups/{organizationGroupUuid}/updates/{updatePolicyUuid}/pending-status-search` — New - Performs pending evaluation search on the device statuses for a given update policy

## DeviceAttributesV1

- **POST** `/devices/model-details` — New - Load device model details for given device manufacturers

## DeviceCustomAttributes

- **PUT** `/devices/customattributes` — New - Bulk update of device custom attributes
- **GET** `/devices/customattribute/search` — Searches for device custom attributes
- **GET** `/devices/customattribute/changereport` — Searches for changes made to device custom attributes
- **PUT** `/devices/{id}/customattributes` — Updates the device custom attribute value by device id
- **DELETE** `/devices/{id}/customattributes` — Deletes the device custom attributes by device id
- **PUT** `/devices/serialnumber/{serialnumber}/customattributes` — Updates the device custom attribute value by serial number
- **DELETE** `/devices/serialnumber/{serialnumber}/customattributes` — Deletes the device custom attributes by serial number
- **PUT** `/devices/assetnumber/{assetnumber}/customattributes` — Updates the device custom attribute value by asset number

## DeviceEnrollmentProgramV1

- **GET** `/dep/profiles/search` — Returns a collection of Automated Device Enrollment profiles based on the search criteria
- **GET** `/dep/profiles/{profileUuid}` — New - Get Device Enrollment Program profile based on the profile unique identifier
- **PUT** `/dep/profiles/{profileUuid}` — New - Edit an existing Device Enrollment Program profile
- **DELETE** `/dep/profiles/{profileUuid}` — New - Delete Device Enrollment Program profile based on the profile unique identifier
- **POST** `/dep/profiles` — New - Adds a new Device Enrollment Program profile
- **GET** `/dep/certificates/{certId}` — New - Get Device Enrollment Program certificate to upload in the Device Enrollment Program portal
- **POST** `/dep/certificates/{organizationGroupId}` — New - Generate a new Device Enrollment Program certificate
- **POST** `/dep/accounts/{organizationGroupId}` — New - Create a new DEP account for the organization group
- **DELETE** `/dep/accounts/{organizationGroupId}` — New - Deletes DEP and associated DEP profiles for the given organization group
- **GET** `/dep/groups/{groupUuid}/devices` — New - Gets all Apple Automated Device Enrollment devices at organization group
- **PUT** `/dep/groups/{groupUuid}/devices` — New - Fetches or syncs Apple Automated Device Enrollment devices belonging to the organization group
- **PUT** `/dep/profiles/{profileUuid}/devices/{serialNumber}` — New - Assign or unassign a Automated Device Enrollment profile from device
- **GET** `/dep/profiles/{profileUuid}/devices` — New - Gets all Apple Automated Device Enrollment devices assigned to the profile

## DeviceLogV1

- **GET** `/devices/{deviceUuid}/sources/{sourceUuid}/logs` — New - Gets the logs associated with particular source from device

## Devices

- **GET** `/devices` — New - Get Device details by Alternate id
- **PUT** `/devices` — New - Edit the device details identified by alternate id for Device
- **POST** `/devices` — New - Retrieves information about multiple devices identified by the specified id type
- **DELETE** `/devices` — New - Deletes Device details by alternate id for Device
- **GET** `/devices/{id}` — New - Get Device details by Device id
- **PUT** `/devices/{id}` — New - Edit the device details identified by Device id
- **DELETE** `/devices/{id}` — New - Delete Device details by Device id
- **GET** `/devices/{uuid}/tags` — New - Retrieves associated tags for a device
- **POST** `/devices/{device_uuid}/tags/{tag_uuid}` — New - Associates tag with a device
- **DELETE** `/devices/{device_uuid}/tags/{tag_uuid}` — New - Dissociate tag from a device
- **GET** `/devices/udid/{udid}` — New - Get device info based on UDID
- **GET** `/devices/litesearch` — New - Searches devices and its custom attributes
- **GET** `/devices/extensivesearch` — New - Extensive search of device details
- **GET** `/devices/search` — New - Find relevant devices using various criteria
- **POST** `/devices/bulk` — New - Deletes multiple devices identified by device id or alternate id
- **POST** `/devices/id` — New - Retrieves information about multiple devices identified by device id
- **GET** `/devices/{deviceUuid}/filesactions` — New - Gets FilesActions by Device UUID
- **GET** `/devices/{deviceUuid}/eventactions` — New - Gets Event Actions by Device UUID
- **POST** `/devices/managedsettings` — Sets the managed settings for an iOS device based on alternate id
- **GET** `/devices/bulksettings` — Retrieve limits for bulk actions
- **GET** `/devices/devicecountinfo` — Retrieves Device Count Information which are Categorized by Device Info like Platform, EnrollmentStatus, Ownership etc.
- **GET** `/devices/udid/{udid}/deviceenrollmentstatus` — Retrieves Device status based on the device identifier (UDID)
- **POST** `/devices/serialnumber/{serialnumber}/sendmessage` — Sends a push notification to the device identified by serial number. If not enrolled, sends an SMS message instead
- **POST** `/devices/enrolleddevicescount` — Retrieves Count of all enrolled devices based on any or all of the following OG id, Tag Name, and devices registered after 'SeenSince' datetime until the 'SeenTill' datetime
- **GET** `/ogs/{og_id}/devices/audit` — Returns the device audit history for a device
- **GET** `/devices/{deviceId}/loggedinusers` — Gets all logged in users on the device
- **GET** `/devices/appstatus` — New - Gets App Status for a combination of input elements

## DeviceSamples

- **POST** `/DeviceSamples` — New - Saves the device samples

## DeviceSensors

- **GET** `/devices/{deviceUuid}/sensors` — New - Returns the list of sensors reported by the specified device

## DeviceSensorsV1

- **POST** `/devicesensors` — New - Create a device sensor
- **GET** `/devicesensors/{sensorUuid}` — New - Gets the device sensor information
- **PUT** `/devicesensors/{sensorUuid}` — New - Update the device sensor
- **GET** `/devicesensors/list/{organizationGroupUuid}` — New - Gets the list of all the device sensors for the Organization Group
- **POST** `/devicesensors/assign` — New - Assign device sensors to smart groups
- **POST** `/devicesensors/bulkdelete` — New - Deletes the list of device sensors based on the identifiers provided

## DeviceSmartGroups

- **GET** `/devices/{id}/smartgroups` — Retrieves all the smart groups associated with the device

## DeviceSmartGroupsV1

- **POST** `/devices/smartgroups` — New - Query the smart groups for devices
- **POST** `/devices/smartgroups/device-map-diagnostics` — Query smart groups for devices using device uuid

## DeviceStateMetadataV1

- **GET** `/devicestatemetadata/{organizationgroupUuid}` — New - Get device state attribute metadata for an Organization Group

## DeviceWorkflowV1

- **GET** `/workflows/metadata` — New - Gets the metadata for the workflows assigned to the device
- **POST** `/workflows/query` — New - Gets the workflows for the device

## DirectEnrollmentSettingsV1

- **GET** `/groups/{uuid}/settings/directenrollment` — New - Get direct enrollment settings for Workspace ONE
- **POST** `/groups/{uuid}/settings/directenrollment` — New - Creates a new system override to save direct enrollment settings for Workspace ONE

## DropshipProvisioningActionsV1

- **POST** `/dropship-action/organization-group/{ogUuid}/sync-devices` — New - Sync devices for given organization group

## DsmV1

- **POST** `/dsm/users/{userUuid}/devices/{deviceUuid}/overrides` — Overrides the resource behaviour on the specified device

## EnrollmentTokenActionsV1

- **PUT** `/enrollment-tokens` — New - Update the token's compliance status either reseting or revoking the token
- **POST** `/enrollment-tokens` — New - Get the enrollment tokens
- **DELETE** `/enrollment-tokens` — New - Delete the enrollment tokens
- **PUT** `/enrollment-tokens/{ogUuid}/compliance-statuses/{enrollmentTokenUuid}` — New - Perform update on the compliance status on the enrollment token

## EnrollmentTokenV1

- **GET** `/groups/{ogUuid}/enrollment-tokens/{tokenUuid}` — New - Get device enrollment token details
- **DELETE** `/groups/{ogUuid}/enrollment-tokens/{tokenUuid}` — New - Delete device enrollment token
- **GET** `/groups/{ogUuid}/enrollment-tokens` — New - Returns a list of enrollment tokens that match the search criteria
- **POST** `/groups/{ogUuid}/enrollment-tokens` — New - Creates device enrollment token based on registration type

## EventLog

- **GET** `/devices/{id}/eventlog` — Retrieves events corresponding to the device identified by device Id
- **GET** `/devices/eventlog` — Retrieves events corresponding to the device identified by alternate Id's

## GPS

- **GET** `/devices/{id}/gps` — Retrieves the GPS coordinates of the device identified by device ID
- **GET** `/devices/gps` — Retrieves the GPS coordinates of the device identified by alternate id
- **POST** `/devices/gps` — Executes bulk gps coordinates by device and alternate id
- **POST** `/devices/gps/search` — Retrieves the GPS coordinates of multiple devices within the specified day range

## HubAgentPackagesV1

- **GET** `/product-components/hub-agent-packages/search` — New - Search Airwatch Agent/Hub Packages based on the query information provided

## Launcher

- **POST** `/devices/{deviceUuid}/launcher/enter-admin-mode` — Executes the command ExitAdminMode for a device by the device uuid
- **POST** `/devices/{deviceUuid}/launcher/exit-admin-mode` — Executes the command ExitAdminMode for a device by the device uuid
- **POST** `/devices/{deviceUuid}/launcher/exit` — Executes the command ExitAirWatchLauncher for a device by the device uuid

## LostModeV1

- **PUT** `/devices/{deviceUuid}/lostmode/{enableLostMode}` — New - Updates the lost mode of device

## MessagesV1

- **POST** `/devices/{id}/messages/push` — New - Sends a push message to the device
- **POST** `/devices/{id}/messages/email` — New - Sends an email to the user of the device
- **POST** `/devices/{id}/messages/sms` — New - Sends an SMS message to the device
- **POST** `/devices/messages/push` — New - Sends a push message to the device
- **POST** `/devices/messages/email` — New - Sends an email to the user of the device
- **POST** `/devices/messages/sms` — New - Sends an SMS message to the device
- **POST** `/devices/messages/bulkpush` — New - Sends a push message to multiple devices
- **POST** `/devices/messages/bulkemail` — New - Sends an email to the users of multiple devices
- **POST** `/devices/messages/{id}/message` — New - Sends a message to the device
- **POST** `/devices/messages/message` — New - Sends a message to the device
- **POST** `/devices/messages/bulksms` — New - Sends an SMS message to multiple devices

## Network

- **GET** `/devices/{id}/network` — Returns network information of single device specified by id parameter
- **GET** `/devices/network` — Returns network information of single device from alternate device identifier
- **GET** `/devices/networkinfosearch` — Finds device network information matching specified criteria

## Notes

- **GET** `/devices/notes` — New - Gets DeviceNotes by AlternateId
- **POST** `/devices/notes` — New - Creates DeviceNotes by AlternateId
- **GET** `/devices/notes/{noteid}` — New - Gets DeviceNotes by AlternateId
- **PUT** `/devices/notes/{noteid}` — New - Updates a note identified by note ID for the device identified by device ID
- **DELETE** `/devices/notes/{noteid}` — New - Deletes a note for the device identified by alternate ID
- **GET** `/devices/{id}/notes` — Retrieves the notes for the device identified by device ID
- **GET** `/devices/{deviceId}/notes/{noteId}` — Retrieves a particular note identified by note ID for the device identified by device ID
- **PUT** `/devices/{deviceId}/notes/{noteId}` — Updates a note identified by note ID for the device identified by device ID
- **DELETE** `/devices/{deviceId}/notes/{noteId}` — Deletes a note identified by note ID for the device identified by device ID
- **POST** `/devices/{deviceId}/notes` — Creates a new note for the device identified by device ID

## OemEnrollmentTokenV1

- **GET** `/android-oem-integration/enrollment-token/organization-groups/{organizationGroupUuid}/zebra` — New - Retrieves the enrollment token for the tenant

## OemUpdatesSearchV1

- **GET** `/oem-updates/v1/groups/{uuid}/summary` — New - Returns a collection of OemUpdateSummary details based on the search criteria
- **GET** `/oem-updates/v1/groups/{uuid}/summary/status` — New - Gets the count of OemUpdate Summary installed in devices for a given release_id + version
- **GET** `/oem-updates/v1/groups/{uuid}/summary/devices` — New - Gets the devices where OEM Update Summary is installed (status would be either failed or success)
- **GET** `/oem-updates/v1/groups/{uuid}/device/{deviceUuid}/updates-list` — New - Getting OEM updates for a device

## OemUpdatesV1

- **GET** `/groups/{uuid}/oemupdates/summary` — New - Gets all OEM Update Summary details of a given organization group UUID
- **GET** `/groups/{uuid}/oemupdates/summary/{summaryUuid}/status` — New - Gets the count of OemUpdate Summary installed in devices for a given summaryID
- **GET** `/groups/{uuid}/oemupdates/summary/{summaryUuid}/devices` — New - Gets the devices where OEM Update Summary is installed (status would be either failed or success)
- **GET** `/groups/{uuid}/oemupdates/summary/search` — New - Returns a collection of OemUpdateSummary details based on the search criteria
- **GET** `/groups/{uuid}/device/{deviceUuid}/oemupdates` — New - Gets all OEM Update Summary details of a given organization group UUID

## OperatorTypeMapV1

- **GET** `/device-expression/operator-type-map/organization-group/{ogUuid}` — New - Gets the mapping of all Rules Engine Operator values against types defined in the Schema Registry
- **GET** `/device-expression/operator-type-map/organization-group/{ogUuid}/type/{type}` — New - Gets the supported Operator values in Rules Engine for a particular type defined in the Schema Registry

## OPSDeviceLastSyncDetails

- **GET** `/groups/{ogUuid}/last-sync` — New - Get OPS device last sync details for the given organization group

## OSVersionsV1

- **GET** `/baselines/osversions` — New - Retrieves a list of active os versions
- **GET** `/baselines/osversions/{platformUUID}` — New - Retrieves a list of active os versions for a platform

## Peripherals

- **GET** `/peripherals/printer/{deviceID}` — Gets the printer by identifier
- **GET** `/peripherals/printers/{organizationGroupID}` — Gets the printer by organization group identifier

## PickLists

- **GET** `/picklists/devicecategories` — Gets device category list
- **GET** `/picklists/devicetypes` — Gets device type list
- **GET** `/picklists/platforms/{platform}/operatingsystems` — Gets operating systems list
- **GET** `/picklists/ownershiptypes` — Gets ownership type list
- **GET** `/picklists/platforms/{platform}/devicemodels` — Gets device model list
- **GET** `/picklists/organizationgroups/{ogid}/certificateauthorities` — Gets the list of Certificate Authorities (CA) for an organization group
- **GET** `/picklists/platforms/{platform}/vpntypes` — Gets Vpn Types by Platform
- **GET** `/picklists/organizationgroups/{ogid}/certificateauthorities/{certificateAuthorityId}/certificatetemplates` — Gets the list of Certificate Templates for a Certificate Authority (CA)
- **GET** `/picklists/organizationgroups/{ogid}/timefencingschedules` — Gets Allowed Time Fencing Schedules by Og Id
- **GET** `/picklists/organizationgroups/{ogid}/geofencingareas` — Gets Geo Fencing Areas by Og Id
- **GET** `/picklists/androidpasscodecontent` — Gets Passcode Content for Android
- **GET** `/picklists/androidgraceperiodforpasscodechange` — Gets Android Grace Period for Passcode change
- **GET** `/picklists/androidemailsyncintervals` — Gets E-Mail Sync Intervals for android
- **GET** `/picklists/androidmaxmailstoshow` — Gets Maximum E-mails to show for Android
- **GET** `/picklists/androidincomingmailserverprotocol` — Gets Incomming Mail Server Protocol for android
- **GET** `/picklists/androidoutgoingmailserverprotocol` — Gets Outgoing Mail Server Protocol for android
- **GET** `/picklists/androidrestrictiondataconnection` — Gets Restriction Data Connection for Android
- **GET** `/picklists/androidminwifisecurity` — Gets Minimum Wifi Security for Android
- **GET** `/picklists/androidfontsize` — Gets Font Size for Android
- **GET** `/picklists/androidwifisecuritytype` — Gets Security Type for Android Wifi
- **GET** `/picklists/androidwifisfatype` — Gets sfa Type for Androie Wifi
- **GET** `/picklists/androidwifitfatype` — Gets Tfa Type for Android Wifi
- **GET** `/picklists/androideasmailclient` — Gets Eas Mail Client for Android
- **GET** `/picklists/androideaspastdaysofmailtosync` — Gets Eas past days of mail to sync for Android
- **GET** `/picklists/androideassyncinterval` — Gets Eas Sync Interval for Android
- **GET** `/picklists/androideaspastdaysofcalendartosync` — Gets Eas past days of calendar to sync for Android
- **GET** `/picklists/androideasauthenticationtype` — Gets Eas Authentication Type for Android
- **GET** `/picklists/androideaspasscodecomplexity` — Gets Eas Passcode Complexity for Android
- **GET** `/picklists/androideasminimumpasscodelength` — Gets Eas Minimum Passcode length for Android
- **GET** `/picklists/androideasmaximumpasscodeage` — Gets Eas Maximum Passcode Age for Android
- **GET** `/picklists/androideasautolock` — Gets Eas Auto Lock for Android
- **GET** `/picklists/androideasrestrictiontype` — Gets Eas Restriction Type for Android
- **GET** `/picklists/androideaspeaktime` — Gets Eas Peak Time for Android
- **GET** `/picklists/androideassyncschedule` — Gets Eas Sync Schedule for Android
- **GET** `/picklists/androideascontactsapplication` — Gets Eas Contacts Application for Android
- **GET** `/picklists/androideascalendarapplication` — Gets Eas Calendar Application for Android
- **GET** `/picklists/androidvpnikeidtype` — Gets Vpn IKE ID Type for Android
- **GET** `/picklists/androidcredentialsource` — Gets Credential Source for Android
- **GET** `/picklists/androidsmimecertificatetype` — Gets SMIME certificate type for Android
- **GET** `/picklists/applepasscodeautolock` — Gets the values that can be configured for passcode autolock in minutes(maxInactivity) in Apple passcode profile
- **GET** `/picklists/applepasscodegraceperiod` — Gets the values that can be configured for maximum grace period(maxGracePeriod) in Apple passcode profile
- **GET** `/picklists/applesafariacceptcookies` — Gets the values that can be configured for safari accept cookies(safariAcceptCookies) in Apple Restrictions profile
- **GET** `/picklists/appleratingregion` — Gets the values that can be configured for rating region (ratingRegion) in Apple Restrictions profile
- **GET** `/picklists/appleratingmovies` — Gets the values that can be configured for rating movies (ratingMovies) in Apple Restrictions profile
- **GET** `/picklists/appleratingtvshows` — Gets the values that can be configured for rating tv shows (ratingTVShows) in Apple Restrictions profile
- **GET** `/picklists/appleratingapps` — Gets the values that can be configured for rating apps (ratingApps) in Apple Restrictions profile
- **GET** `/picklists/appleemailaccounttype` — Gets the values that can be configured for Email Account Type (EmailAccountType)
- **GET** `/picklists/appleincomingmailserverauthentication` — Gets the values that can be configured for Incoming mail server authentication (IncomingMailServerAuthentication)
- **GET** `/picklists/appleoutgoingmailserverauthentication` — Gets the values that can be configured for Outgoing mail server authentication (IncomingMailServerAuthentication)
- **GET** `/picklists/applevpnauthenticationmethod` — Gets the values that can be configured for Vpn authentication method (VpnAuthenticationMethod) in Apple VPN profile
- **GET** `/picklists/appleproxytype` — Gets the values that can be configured for Vpn proxy type (HTTPProxyType) in Apple VPN profile
- **GET** `/picklists/appleuserauthenticationtype` — Gets the values that can be configured for User Authentication Type for Apple VPN Profile
- **GET** `/picklists/applemachineauthentication` — Gets values that can be configured for Machine Authentication (IPSecAuthenticationMode) for Apple VPN profile
- **GET** `/picklists/appleencryptionlevel` — Gets values that can be configured for VPN encryption level (PP2PEncryptionLevel) for Apple VPN profile
- **GET** `/picklists/applewifisecuritytype` — Gets values that can be configured for encryption type (EncryptionType) for Apple WIFI profile
- **GET** `/picklists/applewifiproxytype` — Gets the values that can be configured for WIFI proxy type (ProxyType) in Apple WIFI profile
- **GET** `/picklists/applewifiinneridentity` — Gets the values that can be configured for inner authentication (TTLSInnerAuthentication) in Apple WIFI profile
- **GET** `/picklists/appleeaspastdaysofmailtosync` — Gets the the number of days' mail to be synced
- **GET** `/picklists/appleeasawemailclientsyncinterval` — SyncInterval determines the sync interval for the email
- **GET** `/picklists/appleeasawemailclientemailnotifications` — Gets EAS AW Email Client Email Notifications (Notifications) for Apple AirWatch EAS profile
- **GET** `/picklists/appleeasawemailclientpastdaysofmailtosync` — Gets the number of days' mail to sync
- **GET** `/picklists/appleeasawemailclientpastdaysofcalendartosync` — Gets the number of days' calendar to sync
- **GET** `/picklists/appleeasawemailclientpasscodetype` — Gets EAS AW Email Client Passcode Type for Apple
- **GET** `/picklists/appleeasawemailclientcomplexity` — Gets EAS AW Email Client Passcode Complexity for Apple
- **GET** `/picklists/appleeasawemailclienthistory` — Gets EAS AW Email Client Passcode History for Apple
- **GET** `/picklists/appleeasawemailclientmaximumfailedattempts` — Gets EAS AW Email Client Maximum Failed Attempts for Apple
- **GET** `/picklists/applecredentialsource` — Gets the values that can be configured for Credential Source (CertificateSource) for Apple Credentials profile
- **GET** `/picklists/applecredentialsmime` — Gets the values that can be configured for the Credential Smime (Smime) for Apple Credentials profile
- **GET** `/picklists/applescepcredentialsource` — Gets valid Scep Credential Source (CertificateSource) for Apple iOS SCEP profile
- **GET** `/picklists/appleosxpasscodeautolock` — Gets the values that can be configured for passcode autolock in minutes (maxInactivity) in Apple macOS passcode profile
- **GET** `/picklists/appleosxvpnencryptionlevel` — Gets values that can be configured for VPN encryption level (PP2PEncryptionLevel) for Apple macOS VPN profile
- **GET** `/picklists/appleosxvpnuserauthentication/{vpnType}` — Gets Valid UserAuthentication for the specified VpnType
- **GET** `/picklists/appleosxvpnmachineauthentication` — Gets MachineAuthentication For Apple macOS VPN Profile
- **GET** `/picklists/appleosxvpnondemandtypes` — Gets VPN OnDemandType values for Apple macOS platform
- **GET** `/picklists/appleosxvpnproxy` — Gets VPN proxy types for Apple macOS platform
- **GET** `/picklists/appleosxcredentialsource` — Gets valid CredentialSources (CertificateSource) for Apple macOS platform
- **GET** `/picklists/appleosxscepcredentialsource` — Gets valid Scep CredentialSorces (CertificateSource) for Apple macOS platform
- **GET** `/picklists/appleosxemailaccounttype` — Gets valid Email Account types for Apple macOS Platform
- **GET** `/picklists/appleosxemailauthenticationtype` — Gets valid Email Authentication Types for Apple macOS Platform
- **GET** `/picklists/appleosxrestrictionallowedapplications` — Gets eligible applications to apply restriction of Apple macOS platform
- **GET** `/picklists/appleosxrestrictionallowedwidgets` — Gets eligible widgets to apply restriction of Apple macOS platform
- **GET** `/picklists/appleosxnetworkinterface` — Gets Network Interfaces for Apple macOS Platform
- **GET** `/picklists/appleosxnetworksecuritytype` — Gets Network Security Protocols for Apple macOS Wi-Fi payload
- **GET** `/picklists/appleosxnetworkinneridentity` — Gets Network Inner Identity of TTLS protocol in Apple macOS Wi-Fi payload
- **GET** `/picklists/appleosxnetworkproxytype` — Gets Valid ProxyTypes for Apple macOS Wi-Fi Payload
- **GET** `/picklists/windowspcwificonnectiontype` — Returns Valid Wifi Connection Types for Windows PC platform
- **GET** `/picklists/windowspcwificonnectionmode` — Returns Valid Wifi Connection Modes for Windows PC platform
- **GET** `/picklists/windowspcwifisecuritytype` — Returns Valid Wifi Security Types for Windows PC platform
- **GET** `/picklists/windowspcwifiencryptiontype` — Returns Valid Wifi Encryption Types for Windows PC platform
- **GET** `/picklists/windowspccredentialsource` — Returns Crdential Source for Windows PC platform
- **GET** `/picklists/windowspccredentialstorelocation` — Returns Crdential Store Location for Windows PC platform
- **GET** `/picklists/windowspccredentialcertificatestore` — Returns Crdential Certificate Store for Windows PC platform
- **GET** `/picklists/windowspcencryptedvolume` — Returns Encrypted volume for Windows PC platform
- **GET** `/picklists/windowspcupdatesource` — Returns Windows Update Source for Windows PC platform
- **GET** `/picklists/windowspcimportantupdates` — Returns Important Updates for Windows PC platform
- **GET** `/picklists/windowsmobilecredentialsource` — Gets Credential Source for WindowsMobile
- **GET** `/picklists/windowsmobilecertificatestore` — Gets Certificate Store for WindowsMobile
- **GET** `/picklists/windowsmobilewifisecuritytype` — Gets Security Type for Windows Mobile Wifi

## PlatformsV1

- **GET** `/baselines/platforms` — New - Retrieves a list of active platforms

## PoliciesV1

- **POST** `/android-oem-integration/policies/organization-groups/{organizationGroupUuid}` — New - Create an Android Update Policy
- **POST** `/android-oem-integration/policies/organization-groups/{organizationGroupUuid}/search` — New - Search Update Policies
- **GET** `/android-oem-integration/policies/organization-groups/{organizationGroupUuid}/policy/{policyUuid}` — New - Get an Android Update Policy
- **PUT** `/android-oem-integration/policies/organization-groups/{organizationGroupUuid}/policy/{policyUuid}` — New - Update an Android Update Policy
- **DELETE** `/android-oem-integration/policies/organization-groups/{organizationGroupUuid}/policy/{policyUuid}` — New - Delete an Android Update Policy
- **GET** `/android-oem-integration/policies/organization-groups/{organizationGroupUuid}/policy/{policyUuid}/applicable-devices` — New - Get Applicable Devices for an Android Update Policy
- **GET** `/android-oem-integration/policies/organization-groups/{organizationGroupUuid}/policy/{policyUuid}/applicable-devices-count` — New - Get Applicable Devices count for an Android Update Policy
- **GET** `/android-oem-integration/policies/organization-groups/{organizationGroupUuid}/policy/{policyUuid}/artifacts` — New - Gets the updates artifacts list for a policy and the given tenant

## ProductComponentsV1

- **GET** `/products/conditionsearch` — New - Returns available conditions for the Organization Group
- **GET** `/products/timeconditionsearch` — New - Search for Time Conditions with the specified parameters
- **GET** `/products/fileconditionsearch` — New - Search for file conditions with the specified parameters
- **GET** `/products/eventactionslist` — Retrieves paginated lists of events actions for the specified organization group and page size
- **GET** `/products/productcomponents` — Retrieves product components being pushed to a given relay server
- **GET** `/products/{devicepolicyuuid}/relay-servers-queue/{relayserveruuid}` — Retrieves product components being pushed to a given relay server
- **GET** `/products/filesactionssearch` — Searches for the Files/Actions with the search parameters passed
- **GET** `/products/{id}/timesconditions` — Get specified Product time conditions by Product Id
- **GET** `/products/{id}/fileactions` — Get specified Product file actions by Product Id
- **GET** `/products/{id}/profiles` — Returns the list of Profiles which are assigned to the passed Product ID
- **GET** `/products/productdownloadandinstallstatistics` — Retrieves the product installation and download statistics
- **POST** `/products/maintainFileAction` — Creates or updates a file action
- **POST** `/products/maintainCondition` — Creates or updates a condition
- **GET** `/products/{id}/provisioningqueuecounts` — Report back queue counts pertaining to the policy engine
- **GET** `/products/DevicesProcessedPE` — Report back device counts pertaining to the policy engine
- **POST** `/products/maintainEventAction` — Create or update an Event/Action

## ProductSetV1

- **POST** `/productsets/pushproductsetonpolicyengine` — Pushes the Product Set onto the product policy engine
- **POST** `/productsets/ActivateProductInProductSet` — Activates a product in a Product Set
- **POST** `/productsets/DeactivateProductInProduct` — Deactivates a product in a Product Set
- **POST** `/productsets/maintainProductSet` — Creates or updates a Product Set
- **POST** `/productsets/MaintainProductInProductSet` — Adds a product to or modifies an existing product in a Product Set
- **DELETE** `/productsets/RemoveProductFromProductSet/{ogId}/{productSetIdOrName}/{productIdOrName}` — Deletes a product from a Product Set
- **GET** `/productsets/ProductSetInquiry` — Retrieves information about a Product Set and the included products
- **POST** `/productsets/RankAllProductsInProductSet` — Reranks all products in a Product Set
- **POST** `/productsets/{productSetUuid}/reprocess` — New - Initiates a reprocessing of a product set

## ProductsV1

- **POST** `/products/{id}/activate` — Activates the Product
- **POST** `/products/{id}/addsmartgroup/{smartgroupid}` — Adds SmartGroup to Product
- **POST** `/products/{id}/copy` — Copies the existing product to create a new product
- **POST** `/products/create` — Creates a new Product
- **POST** `/products/{id}/deactivate` — Deactivates the Product
- **GET** `/products/devicehealthcheck` — Gets the details of the device health
- **GET** `/products/{id}` — Gets the Product
- **DELETE** `/products/{id}` — New - Deletes the product by the product Id
- **GET** `/products/{appid}/assignments` — Get the products based on Application ID
- **POST** `/products/reprocessProduct` — Initiates a reprocessing of a product
- **POST** `/products/{productUuid}/reprocess` — New - Initiates a reprocessing of a product
- **POST** `/products/maintainProduct` — Creates or updates a product
- **GET** `/products/extensivesearch` — Returns the Products
- **POST** `/products/pushdeviceandpolicyonqueue` — Pushes the device and policy onto the policy engine
- **POST** `/products/{id}/pushdeviceonqueue` — Pushes the device onto the product policy engine
- **POST** `/products/{id}/removesmartgroup/{smartgroupid}` — Removes SmartGroup from the specified Product
- **GET** `/products/search` — Searches for the products with the search parameters passed
- **POST** `/products/{id}/setinstalltime` — Sets the product install time
- **POST** `/products/{id}/update` — Updates the product details
- **GET** `/products/jobstatuschangetimestamp` — Get the details of job status changes
- **GET** `/products/compliance/issues` — New - Returns list of non-compliant devices for products in a OG
- **GET** `/products/compliance/issues/summary` — New - Returns summary of non-compliant devices for products in a OG by product compliance status
- **GET** `/products/provisioningjobs` — Returns jobs and associated products
- **POST** `/products/{productid}/addconditions` — Adds Conditions to Product
- **GET** `/products/{productUuid}/details` — New - Returns the product details for the given product uuid
- **POST** `/products/{productUuid}/force-reprocess` — New - Initiates a force reprocessing of a product
- **POST** `/products/{productUuid}/devices/force-reprocess` — New - Initiates a force reprocessing of a product for devices
- **GET** `/products/{productUuid}/devices/{deviceUuid}/job-details` — New - Get the job details of a product for a device

## Profiles

- **GET** `/devices/{id}/profiles` — Retrieves the profile details of the device by Device ID
- **GET** `/devices/profiles` — Retrieves the profile details of the device identified by alternate ID
- **POST** `/devices/{id}/commands/installprofile` — Installs the profile on device

## ProfilesV1

- **DELETE** `/profiles/{profileUuid}` — New - Deletes a device Profile by its unique identifier
- **POST** `/profiles/{profileid}/remove` — Removes the profile from the device
- **POST** `/profiles/{profileid}/activate` — Activates a Device Profile by Profile Id
- **POST** `/profiles/{profileUuid}/activate` — New - Activates a Device Profile by its unique identifier
- **POST** `/profiles/{profileid}/deactivate` — De-Activates a Device Profile by Profile Id
- **POST** `/profiles/{profileUuid}/deactivate` — New - Deactivates a Device Profile by its unique identifier
- **DELETE** `/profiles/{profileid}` — Deletes the Device Profile by Profile Id
- **POST** `/profiles/uploadcertificate` — Uploads certificate into Airwatch
- **GET** `/profiles/sso/status` — New - Gets sso profiles configuration status for android, ios and windows
- **POST** `/profiles/stagenow/barcode` — New - Generates a barcode to be used with Stage Now
- **POST** `/profiles/certificate/upload/{profileUuid}` — New - Saves an uploaded certificate file and associates it with a profile and Organization Group
- **GET** `/profiles/certificatemap` — List the certificate mappings for a device profile
- **POST** `/profiles/certificatemap` — New - Creates a mapping between a profile and certificate or certificate template
- **DELETE** `/profiles/certificatemap/{mappingID}` — Deletes the mapping between a certificate and profile
- **POST** `/profiles/{profileid}/install` — New - Installs the profile on device
- **GET** `/profiles/{profileuuid}/devices` — New - Returns a list of devices based on the installation status for the specified profile identified by profile uuid
- **GET** `/profiles/{profileUuid}/summary` — New - Returns device count by profile status for the given profile uuid
- **GET** `/profiles/{profileUuid}/detail` — New - Returns device profile details for the given profile uuid

## RegistrationV1

- **POST** `/android-oem-integration/registration/organization-groups/{organizationGroupUuid}/zebra` — New - Registration with zebra data services
- **DELETE** `/android-oem-integration/registration/organization-groups/{organizationGroupUuid}/zebra` — New - Delete registration for specified tenant
- **PATCH** `/android-oem-integration/registration/organization-groups/{organizationGroupUuid}/zebra` — New - Complete authorization, retrieve and store access and refresh tokens for the tenant

## RelayServersV1

- **PUT** `/relayservers` — New - Update the details existing relay server
- **POST** `/relayservers` — New - Creates a new relay server provided valid values are given
- **GET** `/relayservers/{serverId}` — New - Gets details of existing relay server
- **DELETE** `/relayservers/{serverId}` — New - Delete the relay server
- **POST** `/relayservers/contents` — New - Posts contents for the eligible relay server for the product and og inputted
- **POST** `/relayservers/bulk` — New - Creates new relay servers in bulk provided valid values are given

## RelayServersV2

- **POST** `/v2/relayservers` — New - Creates a relay server
- **GET** `/v2/relayservers/{relayServerUuid}` — New - Gets details of existing relay server
- **PUT** `/v2/relayservers/{relayServerUuid}` — New - Updates a relay server
- **DELETE** `/v2/relayservers/{relayServerUuid}` — New - Delete the relay server
- **POST** `/v2/relayservers/search` — New - Search relay servers based on the query information provided
- **GET** `/v2/relayservers/{relayServerUuid}/test-connection` — New - Gets test connection details for Push Relay Servers

## RemoteManagementV1

- **GET** `/remote-management/devices/{deviceUuid}` — New - Gets the device's RM registration information
- **POST** `/remote-management/devices/{deviceUuid}` — New - Registers the device with RM4 server
- **POST** `/remote-management/devices/{deviceUuid}/session` — New - Initiates a Remote Management session

## ResourcesV1

- **POST** `/resources/query` — New - Retrieves the details about the resources

## ScriptAssignmentV1

- **GET** `/scripts/{scriptUuid}/assignments` — New - GetScriptAssignmentsAsync
- **POST** `/scripts/{scriptUuid}/assignments` — New - AddScriptAssignmentAsync
- **GET** `/scriptassignments/{assignmentUuid}` — New - GetScriptAssignmentAsync
- **POST** `/scripts/{scriptUuid}/updateassignments` — New - BulkUpdateScriptAssignmentsAsync

## ScriptsV1

- **GET** `/groups/{organizationGroupUuid}/scripts` — New - GetScriptsByOrganizationGroupAsync
- **POST** `/groups/{organizationGroupUuid}/scripts` — New - CreateScriptAsync
- **POST** `/groups/{organizationGroupUuid}/scripts/samples` — New - Get script samples
- **GET** `/scripts/{scriptUuid}` — New - GetScriptAsync
- **PUT** `/scripts/{scriptUuid}` — New - ReplaceScriptDefinitionAsync
- **POST** `/groups/{organizationGroupUuid}/scripts/bulkdelete` — New - ScriptBulkDelete
- **GET** `/{deviceUuid}/scripts/{scriptUuid}/definition` — New - GetScriptDefinitionAsync
- **GET** `/{deviceUuid}/scripts/{scriptUuid}/config/{configBundleUuid}` — New - GetScriptConfigurationAsync

## SecurityV1

- **GET** `/devices/{id}/security` — Retrieves the security information of the device identified by device ID
- **GET** `/devices/security` — Retrieves the security information of the device identified by device ID
- **GET** `/devices/securityinfosearch` — Searches for Device Security Information for the device
- **GET** `/devices/{uuid}/security/managed-admin-information` — New - Get information of the administrator account configured on a macOS device via the Automated Device Enrollment (ADE)
- **GET** `/devices/{uuid}/security/encryption-status` — New - Get encryption status of an enrolled device
- **GET** `/devices/{uuid}/security/recovery-lock-password` — New - Gets the Recovery Lock password for a macOS device

## SmartGroups

- **GET** `/smartgroups/{id}` — Retrieves the Smart Group Details
- **PUT** `/smartgroups/{id}` — Updates the details of the specified Smart Group
- **DELETE** `/smartgroups/{id}` — Deletes the Smart Group identified by the Smart Group Identifier
- **POST** `/smartgroups` — Creates a smart group in Airwatch
- **GET** `/smartgroups/search` — Searches for smart groups using the query information provided
- **GET** `/smartgroups/{smartgroupid}/devices` — Retrieves the device details in the smart group
- **GET** `/smartgroups/{id}/apps` — Gets List of Apps assigned to Smart Group

## StagingBundlesV1

- **GET** `/product-components/staging-bundles/search` — New - Search Staging Bundles based on the query information provided

## StagingV1

- **POST** `/staging/androidwork/qrcodeenrollment` — New - Retrieves a QRCode pdf file for Enrollment
- **GET** `/staging/{stagingId}` — New - Gets the staging bundle identified by the staging package id provided it is valid
- **DELETE** `/staging/{stagingId}` — New - Delete the staging package identified by the staging package id provided it is valid
- **PUT** `/staging` — New - Update the already existing staging package
- **POST** `/staging` — New - Creates a new staging bundle provided valid values are given

## SyncV1

- **POST** `/android-oem-integration/sync/organization-groups/{organizationGroupUuid}/zebra` — New - Creates a request to sync enrollment and policy status with Zebra Data Services for the devices under a given organization group

## Tags

- **POST** `/tags/addtag` — Add a new tag
- **POST** `/tags/{tagId}/update` — Updates a tag name, tag type or tag avatar
- **DELETE** `/tags/{tagId}` — Delete a tag
- **GET** `/tags/{tagId}/devices` — Retrieves all the devices with the specified tag
- **POST** `/tags/{tagid}/adddevices` — Add devices to the tag
- **POST** `/tags/{tagid}/removedevices` — Remove devices from the tag
- **GET** `/tags/search` — Retrieve the list of tags based off name, organization group, tag type

## TelecomDevices

- **GET** `/telecom/devices/usagehistory` — Searches for telecom device usage history by device using the query information provided
- **GET** `/telecom/devices/bulkusagehistory` — Searches for telecom device usage history in bulk by Organization Group using the query information provided

## TemplatesV1

- **GET** `/baselines/templates` — New - Fetch GPO templates
- **GET** `/baselines/templates/search/{vendorTemplateUUID}` — New - Find a vendor template
- **GET** `/baselines/templates/{baselineTemplateUUID}/policies/{policyUUID}` — New - Fetch a policy with it's recommended values

## ThirdPartyProviderIntegrationManagementV1

- **GET** `/vulnerability-defense/v1/third-party-providers/{provider}/configuration` — New - Gets a third party provider configuration for the given tenant
- **PUT** `/vulnerability-defense/v1/third-party-providers/{provider}/configuration` — New - Updates a third party provider configuration for the given tenant
- **POST** `/vulnerability-defense/v1/third-party-providers/{provider}/configuration` — New - Creates a third party provider configuration for the given tenant
- **DELETE** `/vulnerability-defense/v1/third-party-providers/{provider}/configuration` — New - Deletes a third party provider configuration for the given tenant
- **GET** `/vulnerability-defense/v1/third-party-providers/{provider}/configuration/status` — New - Gets the integration status of a third party configuration for the given tenant
- **PATCH** `/vulnerability-defense/v1/third-party-providers/{provider}/configuration/status` — New - Updates the integration status of a third party configuration for the given tenant
- **POST** `/vulnerability-defense/v1/third-party-providers/{tenantUuid}/configurations` — New - Gets third party configurations
- **POST** `/vulnerability-defense/v1/third-party-providers/{provider}/configuration/validate` — New - Validates a third party provider configuration for the given tenant

## TunnelAdminActionV1

- **GET** `/tunnel/devices/{deviceUuid}/action` — New - Gets the device access information
- **POST** `/tunnel/devices/{deviceUuid}/action` — New - Perform the operation on tunnel device

## TunnelDiscoveryV1

- **GET** `/devices/{deviceUuid}/tunnel/discovery` — New - Retrieves the endpoint details to fetch tunnel configuration details

## TunnelHealthV1

- **GET** `/tunnel/health` — New - Return health information for tunnel connectivity
- **GET** `/tunnel/health/downstream` — New - Return health information for tunnel downstream connectivity from microservice

## TunnelStandaloneClientV1

- **GET** `/devices/{deviceUuid}/tunnel/profile` — New - Retrieves the tunnel configuration for the device
- **POST** `/devices/{uuid}/tunnel/{tunnelConfigUuid}/applications/{bundleId}/profile/{profileUuid}/scep-token/{issuer}` — New - Generates one time token to allow device to obtain authentication certificate

## TunnelTrafficRulesV1

- **GET** `/tunnel/trafficruleset/{organizationGroupUuid}/{dtrSetUuid}/profilelist` — New - Retrieves profiles associated with a specific Device Traffic Rule Set

## TunnelUsersShift

- **POST** `/tunnel/shift-status/bulk` — Tunnel users shift bulk update

## UpdatesPolicyV1

- **POST** `/android-oem-integration/updates/organization-groups/{organizationGroupUuid}` — New - Create an update of a policy for the tenant
- **GET** `/android-oem-integration/updates/organization-groups/{organizationGroupUuid}/update/{updateUuid}` — New - Get an Android Update
- **DELETE** `/android-oem-integration/updates/organization-groups/{organizationGroupUuid}/update/{updateUuid}` — New - Delete an Android Update
- **POST** `/android-oem-integration/updates/organization-groups/{organizationGroupUuid}/bulk-cancel` — New - Bulk Cancel Android Updates
- **POST** `/android-oem-integration/updates/organization-groups/{organizationGroupUuid}/search` — New - Search for updates for the tenant that matches search criteria
- **POST** `/android-oem-integration/updates/organization-groups/{organizationGroupUuid}/bulk-delete` — New - Bulk Delete Adnroid Updates

## UpdatesV1

- **GET** `/updates/{uuid}` — New - Get Specific device update details
- **POST** `/updates/{updateUuid}/groups/{organizationGroupUuid}/deployment` — New - Creates a deployment for a specific device update
- **GET** `/updates` — New - Get device updates by search parameters
- **GET** `/updates/{uuid}/deployments` — New - Get deployments for a device update at a specific Organization Group
- **GET** `/updates/deployments/{uuid}` — New - Gets the device update deployment details
- **PUT** `/updates/deployments/{uuid}` — New - Updates the device update deployment
- **DELETE** `/updates/deployments/{uuid}` — New - Deletes the device update deployment
- **POST** `/updates/{updateUuid}/groups/{organizationGroupUuid}` — New - Starts or stops the roll out of the device update for the specific Organization Group
- **POST** `/updates/{updateUuid}/groups/{organizationGroupUuid}/deployments` — New - Bulk update device update deployments based on custom action
- **GET** `/updates/{updateUuid}/groups/{organizationGroupUuid}/device-readiness` — New - Gets device readiness for a given device update at the specified Organization Group
- **GET** `/updates/{updateUuid}/groups/{organizationGroupUuid}/device-status` — New - Gets the breakdown of device statuses for a given device update at the specified Organization Group
- **GET** `/updates/{updateUuid}/groups/{organizationGroupUuid}/update-status` — New - Gets the device update status for all the assigned devices by search parameters

## Users

- **GET** `/devices/{id}/user` — Retrieves the user details of the device identified by device ID
- **GET** `/devices/user` — Retrieves the user details of the device identified by the alternate ID

## VulnerabilityInsightV1

- **GET** `/vulnerability-defense/vulnerabilities/summary` — New - Get vulnerabilities summary for an organization group
- **POST** `/vulnerability-defense/vulnerabilities/search` — New - Get vulnerabilities impacting devices in an organization group
- **GET** `/vulnerability-defense/vulnerabilities/{vulnerabilityId}` — New - Get details of a vulnerability
- **GET** `/vulnerability-defense/vulnerabilities/{vulnerabilityId}/summary` — New - Get summary of a vulnerability
- **POST** `/vulnerability-defense/vulnerabilities/{vulnerabilityId}/products/search` — New - Get products impacted by a vulnerability
- **POST** `/vulnerability-defense/vulnerabilities/{vulnerabilityId}/devices/search` — New - Get devices impacted by a vulnerability
- **GET** `/vulnerability-defense/products/summary` — New - Get summary of products for an organization group
- **POST** `/vulnerability-defense/products/search` — New - Get products within an organization group
- **GET** `/vulnerability-defense/products/{productId}/vulnerabilities/summary` — New - Get vulnerability summary of a product
- **POST** `/vulnerability-defense/products/{productId}/vulnerabilities/search` — New - Get vulnerabilities impacting a product
- **GET** `/vulnerability-defense/products/{productId}/vulnerabilities/{vulnerabilityId}/remediation` — New - Get remediation details for a specific vulnerability in a product
- **GET** `/vulnerability-defense/devices/{deviceUuid}/vulnerabilities/summary` — New - Get vulnerability summary of a device
- **POST** `/vulnerability-defense/devices/{deviceUuid}/vulnerabilities/search` — New - Get vulnerabilities in a device

## WorkflowDevicesExportV1

- **POST** `/workflows/{workflowUuid}/devices/export` — New - Export devices for a given workflow

## WorkflowEntityV1

- **GET** `/workflows/{entitytype}/search/{entityUuid}` — New - Retrieves a paginated result of the workflows assigned to this entity

## WorkflowImportExportJobsV1

- **GET** `/workflows/jobs` — New - Get all workflow jobs at this organization group
- **POST** `/workflows/jobs/bulkdelete` — New - Delete workflow job and its related output files
- **GET** `/workflows/jobs/{workflowJobUuid}` — New - Get the workflow job corresponding to the workflow job uuid
- **POST** `/workflows/jobs/download-workflow-exports` — New - Download workflow export files

## WorkflowImportExportV1

- **POST** `/workflows/export-workflows` — New - Queues workflows to be exported as json
- **POST** `/workflows/import-workflow` — New - Queues job to import selected workflows
- **POST** `/workflows/copy-workflow` — New - Copies Workflow from one OG to another OG

## WorkflowStatusReporting

- **GET** `/devices/{deviceUuid}/workflows/status` — New - Get the workflow status for device
- **GET** `/devices/{deviceUuid}/workflows/{workflowUuid}/status` — New - Gets the status of the workflow and corresponding steps for the device
- **GET** `/devices/workflows/{workflowUuid}/status/device-count` — New - Get the count of devices for each workflow status
