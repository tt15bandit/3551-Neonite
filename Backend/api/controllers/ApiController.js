const path = require('path');
const NeoLog = require("../../structs/NeoLog")
const { default: axios } = require("axios");
const fs = require('fs')
const jsonwebtoken = require('jsonwebtoken');
const ini = require('ini')
const { getVersionInfo, loadJSON, VersionFilter, misc, compareAndUpdateKeychain, TCPRequests } = require("../../config/defs");
const config = ini.parse(fs.readFileSync(path.join(__dirname, '../../config.ini'), 'utf-8'));
let requested = false
const fortnitegame = loadJSON("../responses/fortnitegame.json")


module.exports = {

	distributionPoints: function (req, res) {
		res.json({
			"distributions": [
				"http://localhost:3551/",
				"https://download.epicgames.com/",
				"https://epicgames-download1.akamaized.net/",
				"https://fastly-download.epicgames.com/"
			]
		});
	},

	launcherCatalogItem: function (req, res) {
		res.json({
			"appName": req.params.appName,
			"labelName": `${req.query.label}-${req.params.platform}`,
			"buildVersion": `NEONITE`,
			"catalogItemId": req.params.catalogItemId,
			"expires": "9999-12-31T23:59:59.999Z",
			"items": {
				"MANIFEST": {
					"signature": "NEONITE",
					"distribution": "http://localhost:3551/",
					"path": `Builds/Fortnite/Content/CloudDir/Neonite.manifest`,
					"additionalDistributions": []
				}
			},
			"assetId": req.params.appName
		})
	},

	manifest: async function (req, res) {
		res.set("content-type", "application/octet-stream")
		if (!requested) {
			res.sendFile(path.join(__dirname, '../../LauncherAssets/Neonite.manifest'));
			requested = true
		}
		else if (requested) {
			const response = await TCPRequests('GET', 'fastly-download.epicgames.com', `${req.originalUrl}`, { responseType: 'stream' });
			requested = false
			response.data.pipe(res);
		}
	},

	ini: function (req, res) {
		res.setHeader("content-type", "application/octet-stream")
		res.sendFile(path.join(__dirname, '../../LauncherAssets/Full.ini'));
	},
	//todo: LauncherAssets -> manifestAssets

	ChunksV4: async function (req, res) {
		res.setHeader("Content-Type", "application/octet-stream");

		const cacheDir = path.join(process.cwd(), "cache/ChunksV4");
		const cacheFile = path.join(cacheDir, req.params.chunkFile);

		if (!fs.existsSync(cacheDir)) {
			fs.mkdirSync(cacheDir, { recursive: true });
		}
		if (fs.existsSync(cacheFile)) {
			return fs.createReadStream(cacheFile).pipe(res);
		}
		else {
			const response = await TCPRequests('GET', 'fastly-download.epicgames.com', `${req.originalUrl}`, { responseType: 'stream' });

			const fileStream = fs.createWriteStream(cacheFile);
			response.data.pipe(fileStream);
			response.data.pipe(res);
		}
	},

	ias: async function (req, res) {
		res.setHeader("Content-Type", "application/octet-stream");

		const cacheDir = path.join(process.cwd(), "cache/ias");
		const cacheFile = path.join(cacheDir, req.params.Hash);

		if (!fs.existsSync(cacheDir)) {
			fs.mkdirSync(cacheDir, { recursive: true });
		}
		if (fs.existsSync(cacheFile)) {
			return fs.createReadStream(cacheFile).pipe(res);
		}
		else {
			const response = await TCPRequests('GET', 'fastly-download.epicgames.com', `${req.originalUrl}`, { responseType: 'stream' });

			const fileStream = fs.createWriteStream(cacheFile);
			response.data.pipe(fileStream);
			response.data.pipe(res);
		}
	},

	iasChunks: async function (req, res) {
		res.setHeader("Content-Type", "application/octet-stream");

		const cacheDir = path.join(process.cwd(), "cache/ias");
		const cacheFile = path.join(cacheDir, req.params.chunkFile);

		if (!fs.existsSync(cacheDir)) {
			fs.mkdirSync(cacheDir, { recursive: true });
		}
		if (fs.existsSync(cacheFile)) {
			return fs.createReadStream(cacheFile).pipe(res);
		}
		else {
			const response = await TCPRequests('GET', 'fastly-download.epicgames.com', `${req.originalUrl}`, { responseType: 'stream' });
			const fileStream = fs.createWriteStream(cacheFile);
			response.data.pipe(fileStream);
			response.data.pipe(res);
		}
	},

	lightSwitchBulk: function (req, res) {
		const serviceId = req.query.serviceId ? req.query.serviceId.toLowerCase() : "fortnite";
		res.json([
			{
				"serviceInstanceId": serviceId,
				"status": "UP",
				"message": "Hi",
				"maintenanceUri": "https://dsc.gg/neonite",
				"allowedActions": [
					"PLAY",
					"DOWNLOAD"
				],
				"banned": false,
				"launcherInfoDTO": {
					"appName": "Fortnite",
					"catalogItemId": "4fe75bbc5a674f4f9b356b5c90567da5",
					"namespace": "fn"
				}
			}
		]);
	},

	lightswitch: function (req, res) {
		const serviceId = req.params.serviceId.toLowerCase();
		res.json({
			"serviceInstanceId": serviceId,
			"status": "UP",
			"message": "Hello",
			"maintenanceUri": "https://dsc.gg/neonite",
			"allowedActions": [],
			"banned": false,
			"launcherInfoDTO": {
				"appName": "Fortnite",
				"catalogItemId": "4fe75bbc5a674f4f9b356b5c90567da5",
				"namespace": "fn"
			}
		})
	},

	eventHistory: function (req, res) {
		res.json([])
	},

	versionCheck: function (req, res) {
		res.json({ "type": "NO_UPDATE" })
	},

	privacy: function (req, res) {
		res.json({
			"accountId": req.params.accountId,
			"optOutOfPublicLeaderboards": false
		})
	},

	dataAsset: function (req, res) {
		const { versionGlobal, version } = getVersionInfo(req);
		const FrontendAssets = loadJSON('../responses/FortniteAssets.json');
		const FortniteGameConfig = loadJSON('../FortniteGameConfig.json');
		const dataAssetBuilder = (dataAssetResponse, primaryAssetType, promotion, primaryAssetName, assetData) => {
			dataAssetResponse[primaryAssetType] ??= {
				meta: { promotion },
				assets: {}
			};
			dataAssetResponse[primaryAssetType].assets[primaryAssetName] = {
				meta: {
					revision: 2,
					headRevision: 2,
					revisedAt: "2023-11-27T06:41:57.818Z",
					promotion: 3,
					promotedAt: "2023-11-27T06:43:00.452Z"
				},
				assetData
			};
		};

		if (version >= 17.40) {
			dataAssetBuilder(FrontendAssets, "FortCreativeDiscoverySurface", 2, "CreativeDiscoverySurface_Frontend", {
				"AnalyticsId": "v538",
				"TestCohorts": [
					{
						"AnalyticsId": "c-1v2_v2_c727",
						"CohortSelector": "PlayerDeterministic",
						"PlatformBlacklist": [],
						"CountryCodeBlocklist": [],
						"ContentPanels": [
							{
								"NumPages": 1,
								"AnalyticsId": "p1114",
								"PanelType": "AnalyticsList",
								"AnalyticsListName": "ByEpicNoBigBattle",
								"CuratedListOfLinkCodes": [],
								"ModelName": "",
								"PageSize": 7,
								"PlatformBlacklist": [],
								"PanelName": "ByEpicNoBigBattle6Col",
								"MetricInterval": "",
								"CountryCodeBlocklist": [],
								"SkippedEntriesCount": 0,
								"SkippedEntriesPercent": 0,
								"SplicedEntries": [],
								"PlatformWhitelist": [],
								"MMRegionBlocklist": [],
								"EntrySkippingMethod": "None",
								"PanelDisplayName": {
									"Category": "Game",
									"NativeCulture": "",
									"Namespace": "CreativeDiscoverySurface_Frontend",
									"LocalizedStrings": [],
									"bIsMinimalPatch": false,
									"NativeString": "LTMS",
									"Key": "ByEpicNoBigBattle6Col"
								},
								"PlayHistoryType": "RecentlyPlayed",
								"bLowestToHighest": false,
								"PanelLinkCodeBlacklist": [],
								"CountryCodeAllowlist": [],
								"PanelLinkCodeWhitelist": [],
								"FeatureTags": [
									"col:5"
								],
								"MMRegionAllowlist": [],
								"MetricName": ""
							},
							{
								"NumPages": 2,
								"AnalyticsId": "p969|88dba0c4e2af76447df43d1e31331a3d",
								"PanelType": "AnalyticsList",
								"AnalyticsListName": "EventPanel",
								"CuratedListOfLinkCodes": [],
								"ModelName": "",
								"PageSize": 25,
								"PlatformBlacklist": [],
								"PanelName": "EventPanel",
								"MetricInterval": "",
								"CountryCodeBlocklist": [],
								"SkippedEntriesCount": 0,
								"SkippedEntriesPercent": 0,
								"SplicedEntries": [],
								"PlatformWhitelist": [],
								"MMRegionBlocklist": [],
								"EntrySkippingMethod": "None",
								"PanelDisplayName": {
									"Category": "Game",
									"NativeCulture": "",
									"Namespace": "CreativeDiscoverySurface_Frontend",
									"LocalizedStrings": [],
									"bIsMinimalPatch": false,
									"NativeString": "Event LTMS",
									"Key": "EventPanel"
								},
								"PlayHistoryType": "RecentlyPlayed",
								"bLowestToHighest": false,
								"PanelLinkCodeBlacklist": [],
								"CountryCodeAllowlist": [],
								"PanelLinkCodeWhitelist": [],
								"FeatureTags": [
									"col:6"
								],
								"MMRegionAllowlist": [],
								"MetricName": ""
							}
						],
						"PlatformWhitelist": [],
						"SelectionChance": 0.1,
						"TestName": "testing"
					}
				],
				"GlobalLinkCodeBlacklist": [],
				"SurfaceName": "CreativeDiscoverySurface_Frontend",
				"TestName": "20.10_4/11/2022_hero_combat_popularConsole",
				"primaryAssetId": "FortCreativeDiscoverySurface:CreativeDiscoverySurface_Frontend",
				"GlobalLinkCodeWhitelist": []
			});
		}

		if (config.FortniteGameConfig === true && version >= 24.00) {
			dataAssetBuilder(FrontendAssets, "FortPlaylistAthena", 1, FortniteGameConfig.playlist_config, FortniteGameConfig.playlist_settings);
		}

		if (versionGlobal >= 32) {
			dataAssetBuilder(FrontendAssets, "FortPlaylistAthena", 9, "Playlist_SunflowerSolo", {
				TimeOfDayManager: "/BlastBerryMap/Game/TimeOfDay/TODM/DSA_UEFN_Sunflower.DSA_UEFN_Sunflower_C"
			});
		}

		if (versionGlobal >= 34) {
			dataAssetBuilder(FrontendAssets, "FortPlaylistAthena", 9, "Playlist_DashBerrySolo", {
				TimeOfDayManager: "/BlastBerryMap/Game/TimeOfDay/TODM/DSA_UEFN_Sunflower.DSA_UEFN_Sunflower_C"
			});
		}

		if (version >= 36.10) {
			dataAssetBuilder(FrontendAssets, "FortPlaylistAthena", 9, "Playlist_TimberStakeSolo", {
				TimeOfDayManager: "/c18c4fa1-4e7f-6d71-5747-149195af86f7/TimeOfDay/DaySequenceActors/DSA_SunFlower_Ch6s1.DSA_SunFlower_Ch6s1_C"
			});
		}

		if (version >= 37.50) {
			dataAssetBuilder(FrontendAssets, "FortPlaylistAthena", 9, "Playlist_SourSpawnSolo", {
				TimeOfDayManager: "/Game/TimeOfDay/DaySequence/DaySequenceActors/BR_Ch6/DSA_BR_Ch6S4_FNM25.DSA_BR_Ch6S4_FNM25_C"
			});
		}

		if (versionGlobal >= 39) {
			dataAssetBuilder(FrontendAssets, "FortPlaylistAthena", 9, "Playlist_PiperBootSolo", {
				TimeOfDayManager: "/Game/TimeOfDay/DaySequence/DaySequenceActors/BR_Ch7/DSA_BR_Ch7S1.DSA_BR_Ch7S1_C"
			});
		}
		if (version >= 40.20) {
			dataAssetBuilder(FrontendAssets, "FortPlaylistAthena", 9, "Playlist_MatchMistSolo", {
				TimeOfDayManager: "/Game/TimeOfDay/DaySequence/DaySequenceActors/BR_Ch7/DSA_BR_Ch7S1.DSA_BR_Ch7S1_C"
			});
		}

		if (versionGlobal >= 39) {
			dataAssetBuilder(FrontendAssets, "FortPlaylistAthena", 1, "Playlist_Trios", {
				PreloadPersistentLevel: "/WildEstate/Maps/WildEstate_Terrain.WildEstate_Terrain"
			})

			if (versionGlobal === 39) {
				dataAssetBuilder(FrontendAssets, "FortPlaylistAthena", 1, "Playlist_DefaultDuo", {
					PreloadPersistentLevel: "/BRMapCh6/Maps/Hermes_Terrain.Hermes_Terrain"
				});
			}
		}
		/*if (misc.bInEditor === true) {
			dataAssetBuilder(FrontendAssets, "CosmeticLoadoutSchema", 1, "LoadoutSchema_Character", {
				"Slots": [
					"/Game/Items/Loadouts/Slots/LoadoutSlot_Character.LoadoutSlot_Character",
					"/Game/Items/Loadouts/Slots/LoadoutSlot_Backpack.LoadoutSlot_Backpack",
					"/Game/Items/Loadouts/Slots/LoadoutSlot_Pickaxe.LoadoutSlot_Pickaxe",
					"/Game/Items/Loadouts/Slots/LoadoutSlot_Glider.LoadoutSlot_Glider",
					"",
					"/Game/Items/Loadouts/Slots/LoadoutSlot_Contrails.LoadoutSlot_Contrails",
					"/Game/Items/Loadouts/Slots/LoadoutSlot_Aura.LoadoutSlot_Aura",
				]
			});
			dataAssetBuilder(FrontendAssets, "CosmeticLoadoutSchema", 1, "LoadoutSchema_LegoSets", {
				"Slots": [
					"",
					""
				],
				bIsSchemaActivatable: false
			});
			dataAssetBuilder(FrontendAssets, "CosmeticLoadoutSchema", 1, "LoadoutSchema_Vehicle", {
				"Slots": [
					"",
					"",
					"",
					"",
					"",
					"",
					"",
				],
				bIsSchemaActivatable: false
			});
			dataAssetBuilder(FrontendAssets, "CosmeticLoadoutSchema", 1, "LoadoutSchema_Vehicle_SUV", {
				"Slots": [
					"",
					"",
					"",
					"",
					"",
					"",
					"",
				],
				bIsSchemaActivatable: false
			});
		}*/
		res.json(FrontendAssets);
	},

	dataAssetFortPlaylist: function (req, res) {
		return res.status(204).end()
	},

	catalog: function (req, res) {
		const { version } = getVersionInfo(req);
		if (VersionFilter.includes(version) || version <= 3.5) {
			return res.status(404).end();
		}
		const shop = version >= 30.10 ? loadJSON("../responses/catalog/shopv3.json")
			: version >= 26.30
				? loadJSON("../responses/catalog/shopv2.json")
				: loadJSON("../responses/catalog/shopv1.json");
		shop.expiration = new Date(new Date().getTime() + 30000).toISOString()
		return res.json(shop)
	},

	catalogBulk: function (req, res) {
		res.json({})
	},

	enabledFeatures: function (req, res) {
		res.json([])
	},

	socialban: function (req, res) {
		res.json({
			"bans": [],
			"warnings": []
		})
	},

	creative: function (req, res) {
		res.json({
			"results": [],
			"hasMore": false
		})
	},

	sac: function (req, res) {
		res.json({
			id: "aabbccddeeff11223344556677889900",
			slug: req.params.affiliateName,
			displayName: req.params.affiliateName,
			status: "ACTIVE",
			verified: true
		})
	},

	contentControls: function (req, res) {
		res.json({
			'data': {
				'ageGate': 0,
				'controlsEnabled': false,
				'maxEpicProfilePrivacy': 'none',
				'principalId': req.params.accountId
			}
		})
	},

	verifyPin: function (req, res) {
		res.json({
			"data": {
				"pinCorrect": true
			}
		})
	},

	fetchLegoWorlds: function (req, res) {
		res.json([
			{
				"world": {
					"namespaceId": "fn",
					"worldId": "0698808c300847598130d19d9ed15d6d",
					"ownerAccountId": req.params.accountId,
					"version": 0,
					"currentVersion": 0,
					"name": "1",
					"createdAt": "2023-12-04T01:48:27.732497643Z",
					"updatedAt": "2023-12-04T01:48:27.736925445Z",
					"sanction": null,
					"metadataConstraint": "juno_default",
					"metadata": {
						"mode": "Sandbox",
						"friendlyCreatures": "On",
						"hostileCreatures": "Off",
						"npcs": "On",
						"dropInventoryOnDeath": "On",
						"seed": 108257004,
						"death": "On",
						"temperature": "Off",
						"thumbnailTableRowName": "Grassland_01",
						"staminaDrain": "On",
						"hunger": "Off"
					},
					"session": {
						"owningSessionId": null,
						"sessionKey": null,
						"currentPlayers": null,
						"sessionCreatedAt": null,
						"lastServerHeartbeat": null,
						"totalSecondsPlayed": 0
					}
				},
				"grants": [],
				"session": null
			},
			{
				"world": {
					"namespaceId": "fn",
					"worldId": "d5c7520e2b534046b739cee2a25c4022",
					"ownerAccountId": req.params.accountId,
					"version": 0,
					"currentVersion": 0,
					"name": "4",
					"createdAt": "2023-12-05T15:15:43.856079102Z",
					"updatedAt": "2023-12-05T15:15:43.865613446Z",
					"sanction": null,
					"metadataConstraint": "juno_default",
					"metadata": {
						"mode": "Survival",
						"friendlyCreatures": "On",
						"hostileCreatures": "On",
						"npcs": "On",
						"dropInventoryOnDeath": "On",
						"seed": 277512771,
						"death": "On",
						"temperature": "On",
						"thumbnailTableRowName": "Grassland_01",
						"staminaDrain": "On",
						"hunger": "On"
					},
					"session": {
						"owningSessionId": null,
						"sessionKey": null,
						"currentPlayers": null,
						"sessionCreatedAt": null,
						"lastServerHeartbeat": null,
						"totalSecondsPlayed": 0
					}
				},
				"grants": [],
				"session": null
			}
		])
	},

	makeLegoWorlds: function (req, res) {
		res.json({
			"namespaceId": "fn",
			"worldId": "d5c7520e2b534046b739cee2a25c4022",
			"ownerAccountId": req.params.accountId,
			"version": 0,
			"currentVersion": 0,
			"name": "4",
			"createdAt": "2023-12-05T15:15:43.856079102Z",
			"updatedAt": "2023-12-05T15:15:43.865613446Z",
			"sanction": null,
			"metadataConstraint": "juno_default",
			"metadata": {
				"seed": 277512771,
				"mode": "Survival",
				"hostileCreatures": "On",
				"friendlyCreatures": "On",
				"dropInventoryOnDeath": "On",
				"hunger": "On",
				"staminaDrain": "On",
				"npcs": "On",
				"thumbnailTableRowName": "Grassland_01",
				"temperature": "On",
				"death": "On"
			},
			"session": {
				"owningSessionId": null,
				"sessionKey": null,
				"currentPlayers": null,
				"sessionCreatedAt": null,
				"lastServerHeartbeat": null,
				"totalSecondsPlayed": 0
			}
		})
	},

	worldInfo: function (req, res) {
		const { version, versionGlobal } = getVersionInfo(req);
		if (version >= 11.00 || versionGlobal >= 11) {
			res.status(404).end()
		}
		else {
			res.json({})
		}
	},

	legoWorldSession: function (req, res) {
		res.status(404).json(
			{
				"messageVars": [
					req.params.worldID,
					"fn"
				],
				"errorMessage": `could not find a session record for world ID ${req.params.worldID} in namespace 'fn'`,
				"errorCode": "errors.com.epicgames.dbs.wasp.world_session_not_found",
				"correlationId": "FN-tauaxoS2kUuaxi4CxfGF5w",
				"numericErrorCode": 1004,
				"responseStatus": 404,
				"intent": "live",
				"originatingService": "wasp-service"
			}
		)
	},

	legoMatchMakingToken: function (req, res) {
		const waspToken = jsonwebtoken.sign({
			"namespaceId": "fn",
			"worldId": req.params.worldId,
			"iss": "epicgames",
			"exp": 1701790200,
			"iat": 1701789900
		}, "ES256");
		res.set("Content-Type", "application/jwt;charset=utf-8")
		res.send(`wasp~${waspToken}`)
	},

	salesEvent: function (req, res) {
		return res.status(404).end()
	},

	gameRating: function (req, res) {
		return res.status(404).end()
	},

	keychain: async function (req, res) {
		if (config.bRefreshKeychainViaKeychainEndpoint == true) {
			try {
				await compareAndUpdateKeychain();
			} catch (err) {
				NeoLog.Error("Unable to connect to keychain endpoints! Falling back to existing keychains on your local disk. Some assets may not be decrypted!");
			}
		}
		const keychainArray = [
			"46159C748694298198A52DC07476FDA3:4CLHOBqSrmS1RkG/SxZYi8Rc0zCmAKxXIBMMUHDl2ag=",
			"1C6FDB12D706D59E15399DB8FD1EFD85:39JQsqlpGBC1xEz4qeYUYT8Nta0ZkYb3GvjEumq+bAM=",
			"299C16019D64B4942BC10988AD3B82A0:jTs56Mt7WtAkJ6p14hizw/FPE7pQ60QW9mKQa2ugnjU=",
			"8EAC5C7EBC5D4B2BE7AC223C88A7C8BD:CfJasRJ6JpLj0yBGbHihEx9+gcu/QFIX1qv3QddYmoc=",
			"E9E8A12CD60F5B7E5FCE97F43565BD4E:cCTmwC/MmQKzjDfE7lzZrTRAGGHqqWAbZ5HQ7KGhCw8=:GameFeaturePlugin_QuailPlaylist_v3",
			"D79AB2C3DF4BEA1654BDFC5904F2B31C:T7Dj643cHywxlsi9u6aWwH8yL4+/JWBwL4sKaRuMkT0=",
			"775056356849367BC0B1B596C264EEC8:Cw8qKaigDQmGnF0LfLAORqiGtOiyAZoRsAKJdu9JPpE=",
			"D79AB2C3DF4BEA1654BDFC5904F2B31C:T7Dj643cHywxlsi9u6aWwH8yL4+/JWBwL4sKaRuMkT0=",
			"213432DC14EE2264EBCFE126AF507BE0:R1zqETEHHbLDKvu4fNFCIwucPrtRCMaWitfFoBYkmgo=",
			"435081A591BB5FDB12F5366465B29558:cQnWAVHDToeSs9iUV7dXlEo/7lzic1uFW+5/LMpYWw4=",
			"AF9A8DD91ECD3531C45DF9DD39C83A6F:ysr/treutIfls5AKhod2kifYg5wthxXkmBXy12ac6MM=",
			"E3DA1D71C4B68FCC8525A4081A592A18:I20vHNntk2wTOlV2yD32/XVZpXvdgUNMeH+xnoj80Mw=",
			"FCA2163FC09B97A55A70611AEFE2B438:xwH/uh4MoYRy/tGQ9tslV07CenGxa8XvBMiriKy+RvY=",
			"67644F946DF9404F175F23C8D1DB3D1F:/x6AcQowLgz3kSzf18gUffIhnj34n19qiea0w1E5JBc=",
			"84BE268FA4A510A2A6D06E9B09FE6D52:c8xfsnyoIapTy6rEfXfpOD+qzgvhRyMjwtzDcdJD/kY=",
			"A6308197EE1E5323173A9E1E352F6AC9:XhYoDJR5OZQXM9myqXqA8yXYwm3h3kiHuk8GCCZy2OQ=",
			"C54286CDBF1C3845ED1B30ED120B7681:PJeaXSIyn4OKMrU7My96blKsG76hY/gJKAWtpEnKgLg=",
			"DC5875627031B431F7CA00EB340AD357:6Z4KjcvJJs7Cd7losTCw5CKMYQ6+f+W6PN0h9BjUu2w=",
			"95F27017E9C9297290DB60941B1C8355:YPWJFdLs7FUG6/8uqCpk7VrfP5Pxuo+u2QposQWrzIY=",
			"2BBA134ECCB70D2F2815F1E532B8C829:L/LscqejB1XTFtcDWJpLl3byAMZvL3lXAQ2WdPPzU9c=",
			"428A9F9F7AF8204CBF66626A1B8BE656:W4s30q8DXgpIC4A6Li5Ic8PHf41EMXIq+pSiAbLfWL8=",
			"BC38720BBB4F7874E1189A61719B3C7A:Vh9GR/gpf+ZjUKiDYljjE02jlD0rd7B2mCgdnVcQlnY=",
			"8ADEA0E32852BBB789AF3EF9528C0093:zuEygUh+jHlYA6BOqtRubPFgqN1UO4zEGHEp/FgxqdM="
		]
		const keychainFile = loadJSON("../responses/keychain.json");
		keychainArray.push(...keychainFile);
		res.json(keychainArray)
	},

	regionCheck: function (req, res) {
		res.json({
			"content_id": "AF9yLAAsklQALFTy",
			"allowed": true,
			"resolved": true,
			"limit": "Res=656"
		})
		//https://github.com/LeleDerGrasshalmi/FortniteEndpointsDocumentation/blob/ec6b267bca542a2b8804084622721a4bd8ae7c7f/EpicGames/IPDataService/RegionCheck.md
	},

	trackData: async function (req, res) {
		const trackData = (await axios.get(`https://cdn.qstv.on.epicgames.com/${req.params.trackdata}`, {
			headers: {
				"Authorization": req.headers.authorization
			},
		})).data;
		return res.json(trackData)
	},

	sparksTrack: async function (req, res) {
		const response = await axios.get(`https://cdn2.unrealengine.com/${req.params.sparksTrack}.dat`, {
			responseType: 'stream'
		});
		response.data.pipe(res);
	},

	sparksLipSyncData: async function (req, res) {
		res.setHeader("content-type", "application/octet-stream")
		const response = await axios.get(`https://cdn2.unrealengine.com/${req.params.sparksLipSyncData}.lad`)
		res.send(response.data)
	},

	trackSegment: async function (req, res) {
		const trackSegmentUrls = [
			'https://pilgrim.qstv.on.epicgames.com',
			'https://cdn-0001.qstv.on.epicgames.com',
			'https://fortnite-vod.akamaized.net'
		];
		for (const segmentUrlArray of trackSegmentUrls) {
			const response = await axios.get(`${segmentUrlArray}${req.originalUrl}`, {
				responseType: 'stream',
				headers: {
					Range: req.headers.range ?? 'bytes=0'
				},
			});

			res.set({
				'Content-Type': response.headers['content-type'],
				'Content-Range': response.headers['content-range'],
				'Accept-Ranges': 'bytes'
			})
			return response.data.pipe(res)
		}
	},

	userSetting: function (req, res) {
		res.json([
			{
				"accountId": req.body.accountId,
				"key": "avatar",
				"value": "cid_003_athena_commando_f_default"
			},
			{
				"accountId": req.body.accountId,
				"key": "avatarBackground",
				"value": "[\"#B4F2FE\",\"#00ACF2\",\"#005679\"]"
			},
			{
				"accountId": req.body.accountId,
				"key": "appInstalled",
				"value": "init"
			}
		])
	},

	epicSettings: function (req, res) {
		res.json(loadJSON("../responses/epic-settings.json"))
	},

	tryPlayOnPlatform: function (req, res) {
		res.set('Content-Type', 'text/plain');
		res.send(true);
	},

	privacySettings: function (req, res) {
		res.json({
			"privacySettings": {
				"playRegion": "PRIVATE",
				"badges": "PRIVATE",
				"languages": "PRIVATE"
			}
		})
	},

	leaderboards: function (req, res) {
		res.json({
			"gameId": "Fortnite",
			"eventId": req.params.eventId,
			"eventWindowId": req.params.eventWindowId,
			"page": 0,
			"totalPages": 1,
			"updatedTime": new Date(new Date().getTime()).toISOString(),
			"entries": [
				{
					"gameId": "Fortnite",
					"eventId": "epicgames_S26_DuosCashCup_EU",
					"eventWindowId": "S26_DuosCashCup_EU_Event1_Round1",
					"teamAccountIds": [
						""
					],
					"liveSessionId": null,
					"pointsEarned": 999,
					"score": 83566254310678,
					"rank": 1,
					"percentile": 0,
					"pointBreakdown": {
						"TEAM_ELIMS_STAT_INDEX:1": {
							"timesAchieved": 999,
							"pointsEarned": 4
						},
						"VICTORY_ROYALE_STAT:1": {
							"timesAchieved": 999,
							"pointsEarned": 4
						}
					},
					"sessionHistory": [
						{
							"sessionId": "5b8dd79a7e664b15b059d5898d8fc41f",
							"endTime": "2023-09-07T20:00:00.000Z",
							"trackedStats": {
								"TIME_ALIVE_STAT": 1302,
								"PLACEMENT_TIEBREAKER_STAT": 74,
								"MMO_LootIsland": 1,
								"VICTORY_ROYALE_STAT": 0,
								"MMO_RadioTower": 0,
								"TEAM_ELIMS_STAT_INDEX": 1,
							}
						}
					],
					"unscoredSessions": [],
					"tokens": [],
					"teamId": ""
				}
			],
			"liveSessions": {}
		})
	},

	eventsDownload: function (req, res) {
		const { versionGlobal } = getVersionInfo(req);
		if (versionGlobal === 9) { return res.status(404) }
		res.json({
			"player": {
				"gameId": "Fortnite",
				"accountId": req.params.accountId,
				"tokens": [],
				"teams": {},
				"pendingPayouts": [],
				"pendingPenalties": {},
				"persistentScores": {},
				"groupIdentity": {}
			},
			"events": [{
				"gameId": "Fortnite",
				"eventId": "epicgames_S26_DuosCashCup_EU",
				"regions": [
					"EU"
				],
				"regionMappings": {
					"EU": "EUCOMP"
				},
				"platforms": [
					"Windows"
				],
				"platformMappings": {},
				"displayDataId": "s26_brcash_duos",
				"eventGroup": "Season26DuosCashCup",
				"announcementTime": "2023-08-25T14:00:00.000Z",
				"appId": null,
				"environment": null,
				"link": {
					"type": "br:tournament",
					"code": "tournament_epicgames_s26_duoscashcup_eu",
					"version": 1
				},
				"metadata": {
					"TeamLockType": "Window",
					"minimumAccountLevel": 1,
					"TrackedStats": [
						"MMO_LootIsland",
						"MMO_RadioTower"
					],
					"RegionLockType": "Event",
					"AccountLockType": "Window"
				},
				"eventWindows": [
					{
						"eventWindowId": "S26_DuosCashCup_EU_Event1_Round1",
						"eventTemplateId": "EventTemplate_S26_DuosCashCup_EU_Event1_Round1",
						"countdownBeginTime": "2023-09-07T15:00:00.000Z",
						"beginTime": "2023-09-07T17:00:00.000Z",
						"endTime": "9999-12-30T20:00:00.000Z",
						"blackoutPeriods": [],
						"round": 0,
						"payoutDelay": 32,
						"isTBD": false,
						"canLiveSpectate": false,
						"scoreLocations": [
							{
								"leaderboardDefId": "S26DuosCashCupRound1LeaderboardDef",
								"windowEndCondition": null,
								"isMainWindowLeaderboard": true
							}
						],
						"visibility": "public",
						"requireAllTokens": [],
						"requireAnyTokens": [],
						"requireNoneTokensCaller": [
							"Season26DuosCashCup_OCE",
							"EpicAccountPrizingRestriction",
							"Season26DuosCashCup_NAC",
							"Season26DuosCashCup_ME",
							"Season26DuosCashCup_ASIA",
							"Season26DuosCashCup_BR"
						],
						"requireAllTokensCaller": [],
						"requireAnyTokensCaller": [],
						"additionalRequirements": [],
						"teammateEligibility": "all",
						"regionMappings": null,
						"metadata": {
							"ServerReplays": true,
							"RoundType": "Qualifiers",
							"liveSpectateAccessToken": "WeeklyTournamentSpectator"
						}
					}
				],
				"beginTime": "2023-09-07T17:00:00.000Z",
				"endTime": "9999-12-30T20:00:00.000Z",
			}],
			"templates": [],
			"scores": [],
			"leaderboardDefs": [{
				"gameId": "Fortnite",
				"leaderboardDefId": "S26DuosCashCupRound1LeaderboardDef",
				"leaderboardStorageId": "Fortnite_GLOBAL",
				"leaderboardInstanceGroupingKeyFormat": "${eventId}",
				"leaderboardInstanceIdFormat": "${windowId}",
				"maxSessionHistorySize": 20,
				"onlyScoreTopN": null,
				"useIndividualScores": false,
				"tiebreakerFormula": {
					"basePointsBits": 11,
					"components": [
						{
							"trackedStat": "VICTORY_ROYALE_STAT",
							"bits": 4,
							"multiplier": null,
							"aggregation": "sum"
						},
						{
							"trackedStat": "TEAM_ELIMS_STAT_INDEX",
							"bits": 12,
							"multiplier": 100,
							"aggregation": "avg"
						},
						{
							"trackedStat": "PLACEMENT_TIEBREAKER_STAT",
							"bits": 14,
							"multiplier": 100,
							"aggregation": "avg"
						},
						{
							"trackedStat": "TIME_ALIVE_STAT",
							"bits": 11,
							"multiplier": null,
							"aggregation": "avg"
						}
					]
				},
				"scoringRuleSetId": "S26DuosCashCupRound1ScoringRules",
				"clampsToZero": true,
				"payoutsConfig": null,
				"bestNTeams": null,
				"hidePlayerScores": false
			}],
			"resolvedWindowLocations": {
				"Fortnite:epicgames_S26_DuosCashCup_EU:S26_DuosCashCup_EU_Event1_Round1": [
					"Fortnite:epicgames_S26_DuosCashCup_EU:S26_DuosCashCup_EU_Event1_Round1"
				]
			}
		})
	},

	region: function (req, res) {
		res.json({
			"continent": {
				"code": "EU",
				"geoname_id": 6255148,
				"names": {
					"de": "Europa",
					"en": "Europe",
					"es": "Europa",
					"fr": "Europe",
					"ja": "ヨーロッパ",
					"pt-BR": "Europa",
					"ru": "Европа",
					"zh-CN": "欧洲"
				}
			},
			"country": {
				"geoname_id": 2635167,
				"is_in_european_union": false,
				"iso_code": "GB",
				"names": {
					"de": "Vereinigtes Königreich",
					"en": "United Kingdom",
					"es": "Reino Unido",
					"fr": "Royaume Uni",
					"ja": "英国",
					"pt-BR": "Reino Unido",
					"ru": "Британия",
					"zh-CN": "英国"
				}
			},
			"subdivisions": [
				{
					"geoname_id": 6269131,
					"iso_code": "ENG",
					"names": {
						"de": "England",
						"en": "England",
						"es": "Inglaterra",
						"fr": "Angleterre",
						"ja": "イングランド",
						"pt-BR": "Inglaterra",
						"ru": "Англия",
						"zh-CN": "英格兰"
					}
				},
				{
					"geoname_id": 3333193,
					"iso_code": "LDN",
					"names": {
						"en": "London"
					}
				}
			]
		})
	},

	brInventory: function (req, res) {
		res.json({
			"stash": {
				"globalcash": parseInt(config.Gold)
			},
		})
	},

	blurl: async function (req, res) {
		const response = await axios.get(`https://cdn-0001.qstv.on.epicgames.com/${req.params.resourceId}/master.blurl`, {
			responseType: 'stream'
		});
		res.set({
			'Content-Type': "application/octet-stream"
		});
		response.data.pipe(res);
	},

	postPartyInstallStatus: function (req, res) {
		const JWT = req.headers["authorization"].replace("Bearer ", "")
		const JWTdecode = jsonwebtoken.decode(JWT)
		res.json({
			"accountId": JWTdecode["sub"],
			"isInstalled": false
		})
	},

	lfgSettings: function (req, res) {
		res.json({
			"isLookingForGroup": true,
			"preferredRegion": "EU"
		})
	},

	followers: function (req, res) {
		res.json({
			"followed": []
		})
	},

	interactions: function (req, res) {
		res.json({
			interactions: [],
		})
	},

	sparks: async function (req, res) {
		const data = await TCPRequests('GET', 'fortnitecontent-website-prod07.ol.epicgames.com', "/content/api/pages/fortnite-game/spark-tracks");
		Object.values(data.data).forEach(item => {
			if (item.track?.au) {
				item.track.au = 'http://localhost:3551/cdn2-unrealengine' + new URL(item.track.au).pathname;
			}
		});
		res.json(data.data);
	},

	eventScreen: async function (req, res) {
		try {
			const data = await TCPRequests('GET', 'fortnitecontent-website-prod07.ol.epicgames.com', "/content/api/pages/fortnite-game/eventscreens");
			res.json(data.data);
		}
		catch {
			res.json(fortnitegame.eventscreens);
		}
	},

	seasonPass: async function (req, res) {
		try {
			const data = await TCPRequests('GET', 'fortnitecontent-website-prod07.ol.epicgames.com', "/content/api/pages/fortnite-game/seasonpasses");
			data.data = JSON.parse(JSON.stringify(data.data).replaceAll('https://cdn2.unrealengine.com', 'http://localhost:3551/cdn2-unrealengine'));
			res.json(data.data)
		}
		catch {
			res.json({
				"_title": "seasonpasses",
				"_noIndex": false,
				"_activeDate": "2024-10-15T00:27:45.046Z",
				"lastModified": "2025-10-09T11:24:05.519Z",
				"_locale": "en-US",
				"_templateName": "blank",
				"battlepassdata": {
					"_title": "battlepassdata",
					"_activeDate": "2025-10-01T18:17:00.000Z",
					"lastModified": "2025-10-01T18:09:44.216Z",
					"_locale": "en-US",
					"_templateName": "BattlePassPurchaseTemplate"
				},
				"figmentpassdata": {
					"_title": "Figmentpassdata",
					"_activeDate": "2025-10-02T08:00:00.000Z",
					"lastModified": "2025-10-01T20:24:42.073Z",
					"_locale": "en-US",
					"_templateName": "BattlePassPurchaseTemplate"
				},
				"legopassdata": {
					"_title": "legopassdata",
					"_activeDate": "2025-08-07T06:00:00.000Z",
					"lastModified": "2025-09-23T21:23:44.909Z",
					"_locale": "en-US",
					"_templateName": "BattlePassPurchaseTemplate"
				},
				"musicpassdata": {
					"_title": "Musicpassdata",
					"_activeDate": "2025-10-09T07:30:00.000Z",
					"lastModified": "2025-10-09T11:24:05.519Z",
					"_locale": "en-US",
					"_templateName": "BattlePassPurchaseTemplate"
				},
				"_suggestedPrefetch": []
			})
		}
	},

	magpieInventory: function (req, res) {
		const { versionGlobal } = getVersionInfo(req);
		let metadata
		if (versionGlobal === 41) { metadata = "{\"StarterRelic\":\"EarthSprite_Variant_A\",\"EquippedVariant\":\"None\"}" }
		if (versionGlobal === 42) { metadata = "{\"StarterRelic\":\"Jonesy_Variant_A\",\"EquippedVariant\":\"None\"}" }
		if (config.relicStarterScreen && !misc.relicStarterScreenDone) {
			res.json({
				"accountId": req.params.accountId,
				"deploymentId": req.params.deploymentId,
				"domain": "FN1",
				"inventory": [],
				"linkMode": "live",
				"workspace": "default"
			})
		}
		else {
			const spriteCollection = loadJSON("../responses/sprites/collection.json")
			const entitlementMetadata = {}

			for (const key in spriteCollection) {
				if (key !== "Currency_ExtractionPoints") {
					entitlementMetadata[key] = JSON.stringify({
						xp: parseInt(config.relicXP),
						ml: config.relicMastered
					})

					// set to owned
					if (config.allRelicsOwned) {
						spriteCollection[key] = 2
					}
				}
			}

			res.json({
				"accountId": req.params.accountId,
				"deploymentId": req.params.deploymentId,
				"domain": "FN1",
				"inventory": [
					{
						"counts": spriteCollection,
						"entitlementMetadata": entitlementMetadata,
						"metadata": metadata,
						"metadataSchemaVersion": 0,
						"moduleId": req.query["moduleFilters"].split(':')[0],
						"purchasedEntitlementConsequentialToGameplay": false
					}
				],
				"linkMode": "live",
				"workspace": "default"
			})
		}
	},

	extractableRelics: async function (req, res) {
		const sprite = req.body.relicId;
		const spriteCollection = loadJSON("../responses/sprites/collection.json")

		switch (req.body.commandId) {
			case "purchase":
				spriteCollection[sprite] = 2

				const extractableRelicsCatalog = loadJSON("../responses/sprites/catalog.json")
				spriteCollection.Currency_ExtractionPoints -= (extractableRelicsCatalog[sprite]?.attributes?.summonCost ?? 0);

				fs.writeFileSync("./responses/sprites/collection.json", JSON.stringify(spriteCollection, null, 2))

				res.status({
					deploymentId: null,
					accountId: null,
					domain: null,
					linkMode: null,
					workspace: null,
					inventory: [{
						moduleId: req.params.moduleId,
						purchasedEntitlementConsequentialToGameplay: false,
						counts: {
							[sprite]: 2
						},
					}]
				})
				break;
			case "equip":
				res.json({
					deploymentId: null,
					accountId: null,
					domain: null,
					linkMode: null,
					workspace: null,
					inventory: [{
						moduleId: req.params.moduleId,
						purchasedEntitlementConsequentialToGameplay: false,
						counts: {
							[sprite]: 2
						},
						metadata: JSON.stringify({
							StarterRelic: sprite,
							EquippedVariant: sprite
						})
					}]
				})
				break;
			case "starter":
				misc.relicStarterScreenDone = true;

				spriteCollection[sprite] = 2
				spriteCollection.Currency_ExtractionPoints = 999999

				fs.writeFileSync("./responses/sprites/collection.json", JSON.stringify(spriteCollection, null, 2))

				res.json({
					deploymentId: null,
					accountId: null,
					domain: null,
					linkMode: null,
					workspace: null,
					inventory: [{
						moduleId: req.params.moduleId,
						purchasedEntitlementConsequentialToGameplay: false,
						counts: {
							[sprite]: 2,
							Currency_ExtractionPoints: 999999
						},
						metadata: JSON.stringify({
							StarterRelic: sprite
						})
					}]
				})
				break;
		}
	},

	extractableRelicsCatalog: function (req, res) {
		res.json(loadJSON("../responses/sprites/catalog.json"))
	},


	questProgress: function (req, res) {
		const { versionGlobal } = getVersionInfo(req);
		const questsv3 = loadJSON("../responses/questsv3.json")
		questsv3["accountXp"].seasonNumber = versionGlobal
		res.json(questsv3)
	},

	cosmoFdeb: async function (req, res) {
		const decodedString = Buffer.from(req.query["d"], "base64").toString("utf8");
		var [fn, version, cosmetic, imageType, randomChars] = decodedString.split('/')
		cosmetic = cosmetic.split(':')[1]
		const cacheDir = path.join(process.cwd(), "cache/images");
		const cacheFile = path.join(cacheDir, `${cosmetic}_${imageType}.png`);

		if (!fs.existsSync(cacheDir)) {
			fs.mkdirSync(cacheDir, { recursive: true });
		}
		if (fs.existsSync(cacheFile) && fs.statSync(cacheFile).size > 500) {
			res.setHeader("Content-Type", "image/png");
			return fs.createReadStream(cacheFile).pipe(res);
		}
		else {
			const response = await TCPRequests('GET', 'cosmo.fdeb.live.use1a.on.epicgames.com', req.originalUrl, { responseType: "stream" })
			res.set({
				'Content-Type': "image/png",
			});
			if (response == null) {
				fs.createReadStream(path.join("./Fallback.png")).pipe(res);
			}
			else {
				const fileStream = fs.createWriteStream(cacheFile);
				response.data.pipe(fileStream);
				response.data.pipe(res);
			}
		}
	},

	contentLinkPackage: async function (req, res) {
		/*
		 * This endpoint requires auth on Epics server
		 * The data in this cooked-content-package changes every update
		 * It gets routed trough a caching server which stores this and requests new ones when needed
		*/
		const response = await axios.post(`https://epic-cache.neptune.cbn.lol/content/cooked-content`, {
			linkCode: req.params.linkId,
			role: req.query.role || "client",
			client: req.query.platform || "windows",
			majorVersion: parseInt(req.query.major),
			minorVersion: parseInt(req.query.minor),
			patch: parseInt(req.query.patch),
			shaderformat: req.query.shaderformat || "",
		});
		res.json(response.data.result);
	},

	cookedContentChunk: async function (req, res) {
		res.setHeader("Content-Type", "application/octet-stream");
		const cacheDir = path.join(process.cwd(), "cache/cookedContentChunks");
		const cacheFile = path.join(cacheDir, req.params.chunkFile);

		if (!fs.existsSync(cacheDir)) {
			fs.mkdirSync(cacheDir, { recursive: true });
		}
		if (fs.existsSync(cacheFile)) {
			return fs.createReadStream(cacheFile).pipe(res);
		}
		else {
			const response = await axios.get(`https://cooked-content-live-cdn.epicgames.com${req.originalUrl}`, ({ responseType: 'arraybuffer' }))
			res.set({
				'Content-Type': 'binary/octet-stream',
				'Content-Length': response.data.length,
				'Last-Modified': response.headers['last-modified'],
				'ETag': response.headers['etag'],
				'x-amz-meta-content-md5': response.headers['x-amz-meta-content-md5']
			});
			fs.writeFileSync(cacheFile, response.data);
			res.send(response.data);
		}
	},

	cookedContentPlugin: async function (req, res) {
		const response = await axios.get(`https://cooked-content-live-cdn.epicgames.com${req.originalUrl}`, ({ responseType: 'arraybuffer' }))
		res.set({
			'Content-Length': response.data.length,
			'Last-Modified': response.headers['last-modified'],
			'ETag': response.headers['etag'],
			'x-amz-meta-content-md5': response.headers['x-amz-meta-content-md5']
		});
		res.send(response.data);
	},

	publicAccounts: async function (req, res) {
		res.json({
			"accounts": [
				{
					"accountId": req.query.accountId,
					"tags": []
				}
			]
		})
	},

	playerTokens: function (req, res) {
		res.json({
			"accounts": [{
				"accountId": "e7c388664e5442e89f30b396d9fa7183",
				"tokens": []
			}]
		})
	},

	heraMesh: function (req, res) {
		res.json({
			"SpecialEventScriptMeshActorData": {},
			"MeshNetworkedEvent.Clash.FactionB": {
				"metadataStructName": "MeshNetworkedEventMetadata",
				"metadataStructData": {
					"requiredValue": 2000000000,
					"bHasInitialized": true,
					"bHasCompleted": true,
					"currentValue": 2000000000
				}
			},
			"MeshNetworkedEvent.Clash.FactionA": {
				"metadataStructName": "MeshNetworkedEventMetadata",
				"metadataStructData": {
					"requiredValue": 2000000000,
					"bHasInitialized": true,
					"bHasCompleted": true,
					"currentValue": 2000000000
				}
			},
			"MeshNetworkedEvent.FactionDuelVictory": {
				"metadataStructName": "MeshNetworkedEventMetadata",
				"metadataStructData": {
					"requiredValue": 4000000000,
					"bHasInitialized": true,
					"bHasCompleted": true,
					"currentValue": 4000000000
				}
			}
		})
	},

	downtimeMeshNetwork: function (req, res) {
		res.json({
			"NightNightFrontend": {
				"AreWeGettingSleepy": "VeryVerySleepyUwU",
				"HasDaddyTuckedUsIn": config.bEnableDowntimeScreen,
				"ForcedPlaylist": false,
				"Splines": [
					"C624A3D18A8A2494288EE915D11518B7:/q+bDo9akBx2JId6QvLQW1YoN4jBEEn+QdzBXjB3OpQ=",
					"F00E08CB606091AEFAB37D9B0A01B833:uEmoAK5xdbd8KefVf9o7uJiGcGTYk2r9QevsGe4vBII=",
					"857A238C0BA80D892571ACE78CD3187C:eLLEqOAgRjz78Z4YT6dLxL3DetAW1c2BM4oTPp912ak=",
					"60CE6E28E6993C1DC1C58E839E7A7284:ZlOTwn6YbAK9HetjsiQo0AS1jwJQnLJY7NkR5i7o2/g="
				]
			}
		})
	},

	cdnImages: async function (req, res) {
		const cacheDir = path.join(process.cwd(), "cache/images");
		const cacheFile = path.join(cacheDir, req.params.image);
		if (!fs.existsSync(cacheDir)) {
			fs.mkdirSync(cacheDir, { recursive: true });
		}
		if (fs.existsSync(cacheFile)) {
			res.setHeader("Content-Type", "image/png");
			return fs.createReadStream(cacheFile).pipe(res);
		}
		else {
			const response = await axios.get(
				`https://cdn2.unrealengine.com/${req.params.image}`,
				{ responseType: "stream" }
			);
			res.set({
				'Content-Type': response.headers["Content-Type"]
			});
			const fileStream = fs.createWriteStream(cacheFile);
			response.data.pipe(fileStream);
			response.data.pipe(res);
		}
	},

	socsSettingQuery: function (req, res) {
		res.json({
			"settings": [
				{
					"id": "v1AccessibilityAllowVoiceDictation",
					"userOverrides": [],
					"default": "false"
				},
				{
					"id": "v1AccessibilityReadMessagesAloud",
					"userOverrides": [],
					"default": "false"
				},
				{
					"id": "v1GlobalNicknamesHasSeenDisclosure",
					"userOverrides": [],
					"default": "false"
				},
				{
					"id": "v1VoiceChatMode",
					"userOverrides": [],
					"default": "openMic"
				},
				{
					"id": "v1VoiceChatReportingDisclosureAcceptanceStatus",
					"userOverrides": [
						{
							"scopes": {},
							"value": "seen-not-accepted"
						}
					],
					"default": "never-shown"
				},
				{
					"id": "v1VoiceInputDevice",
					"userOverrides": [],
					"default": ""
				},
				{
					"id": "v1VoiceInputVolume",
					"userOverrides": [],
					"default": "50"
				},
				{
					"id": "v1VoiceOutputDevice",
					"userOverrides": [],
					"default": ""
				},
				{
					"id": "v1VoiceOutputVolume",
					"userOverrides": [],
					"default": "50"
				},
				{
					"id": "v1VoicePushToTalkKeybinding",
					"userOverrides": [],
					"default": ""
				}
			]
		})
	},

	okStatus: function (req, res) {
		res.status(200).end()
	},

	noContent: function (req, res) {
		if (req.originalUrl.includes("/datarouter/api/v1/public/data")) {
			if (JSON.stringify(req.body).includes("WindowsCookedEditor")) {
				misc.bInEditor = true
			}
			else if (JSON.stringify(req.body).includes("WindowsClient")) {
				misc.bInEditor = false
			}
		}
		res.status(204).end()
	},

	installation: function (req, res) {
		res.status(304)
	},

	operations: function (req, res) {
		res.status(304)
	},

	statsigInitialize: function (req, res) {
		res.json({
			"feature_gates": {
				"555581111": {
					"name": "555581111",
					"value": false,
					"rule_id": "default",
					"id_type": "userID",
					"secondary_exposures": []
				},
				"2202221610": {
					"name": "2202221610",
					"value": false,
					"rule_id": "7iAgUmIStDmb1WTpkwKzNU",
					"id_type": "userID",
					"secondary_exposures": []
				},
				"2202221632": {
					"name": "2202221632",
					"value": true,
					"rule_id": "3uHQt1q21mEhOg3GPNYOoa",
					"id_type": "userID",
					"secondary_exposures": []
				},
				"2202221694": {
					"name": "2202221694",
					"value": true,
					"rule_id": "2PqER4Ca0He6paXOSVQycP",
					"id_type": "userID",
					"secondary_exposures": []
				},
				"2202221697": {
					"name": "2202221697",
					"value": true,
					"rule_id": "3Pc2BAUIdsaroXeOLpdevr",
					"id_type": "userID",
					"secondary_exposures": []
				},
				"2202221698": {
					"name": "2202221698",
					"value": true,
					"rule_id": "6WYF59Mx1Dhp94euwSjseg",
					"id_type": "userID",
					"secondary_exposures": []
				},
				"2202221699": {
					"name": "2202221699",
					"value": false,
					"rule_id": "d4wTc5hxHX4pEz4HkLduZ",
					"id_type": "userID",
					"secondary_exposures": []
				},
				"2202221700": {
					"name": "2202221700",
					"value": false,
					"rule_id": "2TpnZC6ERorl0XfP7YPYnA",
					"id_type": "userID",
					"secondary_exposures": []
				},
				"2202221702": {
					"name": "2202221702",
					"value": true,
					"rule_id": "6yFGLqdTTx2vW36kVPODDO",
					"id_type": "userID",
					"secondary_exposures": []
				},
				"2202221725": {
					"name": "2202221725",
					"value": true,
					"rule_id": "6bQtAJJeXyY3COmdrTaiTE",
					"id_type": "userID",
					"secondary_exposures": []
				},
				"2202221726": {
					"name": "2202221726",
					"value": false,
					"rule_id": "G1482dz4tycSX28WWBMUM",
					"id_type": "userID",
					"secondary_exposures": []
				},
				"2202221727": {
					"name": "2202221727",
					"value": true,
					"rule_id": "55T5w1D7EAf1T6GbnZRcIK",
					"id_type": "userID",
					"secondary_exposures": []
				},
				"2202221728": {
					"name": "2202221728",
					"value": true,
					"rule_id": "2FzoPLDvu26xi82CCXKGfa",
					"id_type": "userID",
					"secondary_exposures": []
				},
				"2202221729": {
					"name": "2202221729",
					"value": false,
					"rule_id": "64foQgTNkzBeR1xIJ7QiR2",
					"id_type": "userID",
					"secondary_exposures": []
				},
				"2202221730": {
					"name": "2202221730",
					"value": false,
					"rule_id": "3ah39zoyxuBdBXqBwTx9B5",
					"id_type": "userID",
					"secondary_exposures": []
				},
				"2202221731": {
					"name": "2202221731",
					"value": true,
					"rule_id": "2RqVsIHae1Rv9EJsXaUz6n",
					"id_type": "userID",
					"secondary_exposures": []
				},
				"2202221732": {
					"name": "2202221732",
					"value": false,
					"rule_id": "1HYxprEgGcBfuVoB0jUmAX",
					"id_type": "userID",
					"secondary_exposures": []
				},
				"2222296852": {
					"name": "2222296852",
					"value": false,
					"rule_id": "1o90kLNHJUycjnz6vRVtCA:0.00:2",
					"id_type": "userID",
					"secondary_exposures": []
				},
				"2287796877": {
					"name": "2287796877",
					"value": true,
					"rule_id": "32RVxT1SSqEyqlteMTYCet",
					"id_type": "userID",
					"secondary_exposures": []
				},
				"2287796878": {
					"name": "2287796878",
					"value": false,
					"rule_id": "4qzqPk5dhqSju6NzxlwmT7:50.00:1",
					"id_type": "userID",
					"secondary_exposures": []
				},
				"2287796939": {
					"name": "2287796939",
					"value": false,
					"rule_id": "3PhE8VP9h1813PaOS7pgv:0.00:2",
					"id_type": "userID",
					"secondary_exposures": []
				},
				"2287796940": {
					"name": "2287796940",
					"value": false,
					"rule_id": "2dsFbkPkLNkwsvDRxW596Y:0.00:2",
					"id_type": "userID",
					"secondary_exposures": []
				},
				"2287796944": {
					"name": "2287796944",
					"value": false,
					"rule_id": "3BhQoUXmyjsJ0uBtC6UPB6:0.00:1",
					"id_type": "userID",
					"secondary_exposures": []
				},
				"2287796970": {
					"name": "2287796970",
					"value": false,
					"rule_id": "3pUgAz1sw0ZzQ1oMLOuRXR:0.00:2",
					"id_type": "userID",
					"secondary_exposures": []
				},
				"2981059881": {
					"name": "2981059881",
					"value": false,
					"rule_id": "default",
					"id_type": "userID",
					"secondary_exposures": []
				},
				"3433576047": {
					"name": "3433576047",
					"value": false,
					"rule_id": "default",
					"id_type": "userID",
					"secondary_exposures": []
				},
				"3458750188": {
					"name": "3458750188",
					"value": false,
					"rule_id": "default",
					"id_type": "userID",
					"secondary_exposures": []
				},
				"3652324091": {
					"name": "3652324091",
					"value": false,
					"rule_id": "default",
					"id_type": "userID",
					"secondary_exposures": []
				},
				"4016974275": {
					"name": "4016974275",
					"value": false,
					"rule_id": "default",
					"id_type": "userID",
					"secondary_exposures": []
				}
			},
			"dynamic_configs": {
				"4221649": {
					"name": "4221649",
					"value": {
						"show_discover_redux_frontend": true
					},
					"rule_id": "2Plzg4RFSODsWV7ckaFy54",
					"group": "2Plzg4RFSODsWV7ckaFy54",
					"group_name": "Test",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": true,
					"is_user_in_experiment": true,
					"secondary_exposures": []
				},
				"71391204": {
					"name": "71391204",
					"value": {
						"shop_frame_break": true
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Test",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"230199021": {
					"name": "230199021",
					"value": {
						"epic_rewards_text": "Earn",
						"epic_button_position": "Left",
						"epic_styling_emphasis": true,
						"display_epic_rewards_earned_back_amount": true
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Control",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"is_in_layer": true,
					"explicit_parameters": [
						"epic_rewards_text"
					],
					"secondary_exposures": []
				},
				"285639926": {
					"name": "285639926",
					"value": {
						"allow_leaving_today": true
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Test",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"286932707": {
					"name": "286932707",
					"value": {
						"prefix_ai_search": true
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Test",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"290071357": {
					"name": "290071357",
					"value": {
						"show_bonus_percentage": true,
						"use_new_highlight_style": true,
						"bonus_amount_position": "Top"
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Test B",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"384502199": {
					"name": "384502199",
					"value": {
						"BattlePassTopNav": "False"
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Control",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"572381754": {
					"name": "572381754",
					"value": {
						"show_preview": true
					},
					"rule_id": "5Vki6ANSjXaHDGGwTo7vyO",
					"group": "5Vki6ANSjXaHDGGwTo7vyO",
					"group_name": "Test",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": true,
					"is_user_in_experiment": true,
					"secondary_exposures": []
				},
				"763770983": {
					"name": "763770983",
					"value": {
						"curated_for_you": true
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Test",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"861704309": {
					"name": "861704309",
					"value": {},
					"rule_id": "prestart",
					"group": "prestart",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"946310972": {
					"name": "946310972",
					"value": {
						"change_shop_tile_highlight": true
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Test",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"959370736": {
					"name": "959370736",
					"value": {},
					"rule_id": "inlineTargetingRules",
					"group": "inlineTargetingRules",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": true,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"967422528": {
					"name": "967422528",
					"value": {
						"present_pass_screen": true
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Test",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"989400328": {
					"name": "989400328",
					"value": {
						"enabled": true
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Test",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"1126023266": {
					"name": "1126023266",
					"value": {},
					"rule_id": "prestart",
					"group": "prestart",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"1218004950": {
					"name": "1218004950",
					"value": {
						"remove_vb_pdp": true
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Test",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"1253340277": {
					"name": "1253340277",
					"value": {},
					"rule_id": "prestart",
					"group": "prestart",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"1258624511": {
					"name": "1258624511",
					"value": {
						"starts_on_discover": false
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Control",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"1437251432": {
					"name": "1437251432",
					"value": {},
					"rule_id": "inlineTargetingRules",
					"group": "inlineTargetingRules",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"1443062455": {
					"name": "1443062455",
					"value": {
						"enabled": true
					},
					"rule_id": "76O54IDRWrOxZDldKWyMUM",
					"group": "76O54IDRWrOxZDldKWyMUM",
					"group_name": "Test",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": true,
					"is_user_in_experiment": true,
					"secondary_exposures": []
				},
				"1451028047": {
					"name": "1451028047",
					"value": {
						"event_data": 0,
						"classification": ""
					},
					"rule_id": "default",
					"group": "default",
					"is_device_based": false,
					"passed": false,
					"id_type": "userID",
					"secondary_exposures": []
				},
				"1481234458": {
					"name": "1481234458",
					"value": {},
					"rule_id": "inlineTargetingRules",
					"group": "inlineTargetingRules",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": true,
					"is_user_in_experiment": false,
					"secondary_exposures": [
						{
							"gate": "3458750188",
							"gateValue": "false",
							"ruleID": "default"
						}
					]
				},
				"1545079096": {
					"name": "1545079096",
					"value": {
						"prefix_ai_search": false
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Control",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"1547953407": {
					"name": "1547953407",
					"value": {
						"show_shop_tab_first": true
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Test",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"1635754258": {
					"name": "1635754258",
					"value": {},
					"rule_id": "prestart",
					"group": "prestart",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"1646517092": {
					"name": "1646517092",
					"value": {},
					"rule_id": "prestart",
					"group": "prestart",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"1707961912": {
					"name": "1707961912",
					"value": {},
					"rule_id": "default",
					"group": "default",
					"is_device_based": false,
					"passed": false,
					"id_type": "userID",
					"secondary_exposures": []
				},
				"1765970767": {
					"name": "1765970767",
					"value": {},
					"rule_id": "inlineTargetingRules",
					"group": "inlineTargetingRules",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": true,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"1802360987": {
					"name": "1802360987",
					"value": {
						"try_on_button": true
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Test",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"1805664155": {
					"name": "1805664155",
					"value": {
						"show_epic_reward_highlight": true
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Test",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"1845541341": {
					"name": "1845541341",
					"value": {
						"allow_new_pdp": true
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Test",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"1865877984": {
					"name": "1865877984",
					"value": {
						"show_pdp": true
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Test",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"1905358901": {
					"name": "1905358901",
					"value": {
						"show_compatibility_tags_in_about_popup": true
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Test",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"1938138118": {
					"name": "1938138118",
					"value": {
						"AssetCollectionEnabled": false,
						"SampleSize": 1001,
						"MaxExpectedReads": 200002
					},
					"rule_id": "6qH1qyLVeVkywIaZhUkqVI-6qH1qx6SMDb4diD3GMoNCG",
					"group": "6qH1qyLVeVkywIaZhUkqVI-6qH1qx6SMDb4diD3GMoNCG",
					"is_device_based": false,
					"passed": false,
					"id_type": "userID",
					"secondary_exposures": []
				},
				"1949734410": {
					"name": "1949734410",
					"value": {},
					"rule_id": "prestart",
					"group": "prestart",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"2110242324": {
					"name": "2110242324",
					"value": {
						"allow_best_sellers_row": true
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Launched Group",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"2171137552": {
					"name": "2171137552",
					"value": {
						"interval_mins": 10
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Control",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"2181315192": {
					"name": "2181315192",
					"value": {},
					"rule_id": "prestart",
					"group": "prestart",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"2213923408": {
					"name": "2213923408",
					"value": {},
					"rule_id": "prestart",
					"group": "prestart",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"2297270161": {
					"name": "2297270161",
					"value": {
						"ShowBattlePass": "ShowBattlePass"
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Test",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"2359295038": {
					"name": "2359295038",
					"value": {},
					"rule_id": "default",
					"group": "default",
					"is_device_based": false,
					"passed": false,
					"id_type": "userID",
					"secondary_exposures": []
				},
				"2437502778": {
					"name": "2437502778",
					"value": {
						"show_reactions": true
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Test",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"2504539403": {
					"name": "2504539403",
					"value": {
						"bCrewOnRightInUpsell": true,
						"bCrew50PercentInUpsell": true,
						"bCrewAsSliver": false,
						"bAnimateCrewBG": false
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Control-Half-BP-Half-Crew-Static",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"2513015211": {
					"name": "2513015211",
					"value": {
						"enabled": true
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "enabled",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"2530865220": {
					"name": "2530865220",
					"value": {
						"section_id": "for_you_row_top",
						"show_best_sellers": true
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Top",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"2566637081": {
					"name": "2566637081",
					"value": {},
					"rule_id": "inlineTargetingRules",
					"group": "inlineTargetingRules",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": true,
					"is_user_in_experiment": false,
					"secondary_exposures": [
						{
							"gate": "2222296852",
							"gateValue": "false",
							"ruleID": "1o90kLNHJUycjnz6vRVtCA:0.00:2"
						}
					]
				},
				"2589358493": {
					"name": "2589358493",
					"value": {
						"enabled": true
					},
					"rule_id": "78LeLdcJgQ8EpdxqJAY5Q9",
					"group": "78LeLdcJgQ8EpdxqJAY5Q9",
					"group_name": "Test",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": true,
					"is_user_in_experiment": true,
					"secondary_exposures": []
				},
				"2618425241": {
					"name": "2618425241",
					"value": {
						"epic_rewards_text": "Earn",
						"epic_button_position": "Left",
						"epic_styling_emphasis": true,
						"display_epic_rewards_earned_back_amount": true
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Control",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"is_in_layer": true,
					"explicit_parameters": [
						"epic_button_position"
					],
					"secondary_exposures": []
				},
				"2633953390": {
					"name": "2633953390",
					"value": {
						"epic_rewards_text": "Earn",
						"epic_button_position": "Left",
						"epic_styling_emphasis": true,
						"display_epic_rewards_earned_back_amount": true
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Test",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"is_in_layer": true,
					"explicit_parameters": [
						"epic_styling_emphasis"
					],
					"secondary_exposures": []
				},
				"2641464196": {
					"name": "2641464196",
					"value": {
						"show_discover_web_view": false
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Control",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"2827211687": {
					"name": "2827211687",
					"value": {},
					"rule_id": "inlineTargetingRules",
					"group": "inlineTargetingRules",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": true,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"2886651603": {
					"name": "2886651603",
					"value": {},
					"rule_id": "inlineTargetingRules",
					"group": "inlineTargetingRules",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"2952133295": {
					"name": "2952133295",
					"value": {
						"display_content": true
					},
					"rule_id": "5wkX3Per4mg9JS7xRlmZ1p:override",
					"group": "5wkX3Per4mg9JS7xRlmZ1p:override",
					"group_name": "Test",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"2973146634": {
					"name": "2973146634",
					"value": {
						"enable_new_ui": true
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Test",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"3074873282": {
					"name": "3074873282",
					"value": {
						"use_legacy_fn_discover": false
					},
					"rule_id": "3XEiVYXLDKfds4iyMlOiau",
					"group": "3XEiVYXLDKfds4iyMlOiau",
					"group_name": "Test",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": true,
					"is_user_in_experiment": true,
					"secondary_exposures": []
				},
				"3139486296": {
					"name": "3139486296",
					"value": {
						"epic_rewards_text": "Earn",
						"epic_button_position": "Left",
						"epic_styling_emphasis": true,
						"display_epic_rewards_earned_back_amount": true
					},
					"rule_id": "targetingGate",
					"group": "targetingGate",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"is_in_layer": true,
					"explicit_parameters": [
						"display_epic_rewards_earned_back_amount"
					],
					"secondary_exposures": [
						{
							"gate": "3458750188",
							"gateValue": "false",
							"ruleID": "default"
						}
					]
				},
				"3142253616": {
					"name": "3142253616",
					"value": {},
					"rule_id": "inlineTargetingRules",
					"group": "inlineTargetingRules",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": [
						{
							"gate": "2222296852",
							"gateValue": "false",
							"ruleID": "1o90kLNHJUycjnz6vRVtCA:0.00:2"
						}
					]
				},
				"3259557658": {
					"name": "3259557658",
					"value": {
						"show_shop_action_icon": true
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Test",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"3318762208": {
					"name": "3318762208",
					"value": {},
					"rule_id": "prestart",
					"group": "prestart",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"3322011396": {
					"name": "3322011396",
					"value": {},
					"rule_id": "prestart",
					"group": "prestart",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"3401934024": {
					"name": "3401934024",
					"value": {
						"present_pass_upsell": false
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Control",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"3402737484": {
					"name": "3402737484",
					"value": {},
					"rule_id": "prestart",
					"group": "prestart",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"3449026671": {
					"name": "3449026671",
					"value": {},
					"rule_id": "prestart",
					"group": "prestart",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"3456888934": {
					"name": "3456888934",
					"value": {
						"enable_enforce_bandwidth": true,
						"bandwidth_percentage_to_use": 0.5,
						"rollout_percentage": 100,
						"priority_weight_exponent": 3,
						"enable_additional_gameplay_protection": true,
						"gameplay_quality_padding_loss_lower": 0.015,
						"gameplay_quality_padding_loss_upper": 0.05,
						"gameplay_quality_padding_latency_lower": 2,
						"gameplay_quality_padding_latency_upper": 4,
						"gameplay_quality_recovery_time_seconds": 0.5,
						"gameplay_quality_padding_step_exp": 4,
						"gameplay_quality_scoring_delta": 0,
						"gameplay_quality_padding_latency_shift_ms": 15
					},
					"rule_id": "7IpmoSXVQFqPgcmdsfwf0w:90.00:3-7IpmoRiTonhkWMOhR7ABHu",
					"group": "7IpmoSXVQFqPgcmdsfwf0w:90.00:3-7IpmoRiTonhkWMOhR7ABHu",
					"is_device_based": false,
					"passed": true,
					"id_type": "userID",
					"secondary_exposures": []
				},
				"3479277620": {
					"name": "3479277620",
					"value": {
						"set_default_squad_fill": false
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Control",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"3547335595": {
					"name": "3547335595",
					"value": {
						"shop_optimized_touch_layout": true
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Test",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"3577791019": {
					"name": "3577791019",
					"value": {},
					"rule_id": "prestart",
					"group": "prestart",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"3658215525": {
					"name": "3658215525",
					"value": {
						"show_new_crew_ui": true
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Test",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"3674534304": {
					"name": "3674534304",
					"value": {
						"button_type": "base yellow color"
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Control - yellow",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"3695558147": {
					"name": "3695558147",
					"value": {},
					"rule_id": "inlineTargetingRules",
					"group": "inlineTargetingRules",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"3720261994": {
					"name": "3720261994",
					"value": {},
					"rule_id": "inlineTargetingRules",
					"group": "inlineTargetingRules",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"3798827702": {
					"name": "3798827702",
					"value": {},
					"rule_id": "prestart",
					"group": "prestart",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"3813797711": {
					"name": "3813797711",
					"value": {},
					"rule_id": "prestart",
					"group": "prestart",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"3841014879": {
					"name": "3841014879",
					"value": {},
					"rule_id": "prestart",
					"group": "prestart",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"3888124721": {
					"name": "3888124721",
					"value": {},
					"rule_id": "prestart",
					"group": "prestart",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"4048787415": {
					"name": "4048787415",
					"value": {
						"allow_regional_best_sellers": true
					},
					"rule_id": "launchedGroup",
					"group": "launchedGroup",
					"group_name": "Test - Test",
					"is_device_based": false,
					"id_type": "userID",
					"is_experiment_active": false,
					"is_user_in_experiment": false,
					"secondary_exposures": []
				},
				"4171542050": {
					"name": "4171542050",
					"value": {
						"bEnabled": true,
						"StableThreshold": 0.05,
						"BadThreshold": 0.05,
						"StableMinTracked": 4000,
						"StableHoldSeconds": 2,
						"bForceOverride": false
					},
					"rule_id": "default",
					"group": "default",
					"is_device_based": false,
					"passed": false,
					"id_type": "userID",
					"secondary_exposures": []
				}
			},
			"layer_configs": {
				"2022173360": {
					"name": "2022173360",
					"value": {
						"epic_rewards_text": "Earn",
						"epic_button_position": "Left",
						"epic_styling_emphasis": true,
						"display_epic_rewards_earned_back_amount": true
					},
					"rule_id": "default",
					"group": "default",
					"is_device_based": false,
					"explicit_parameters": [],
					"id_type": "userID",
					"secondary_exposures": [
						{
							"gate": "3458750188",
							"gateValue": "false",
							"ruleID": "default"
						}
					],
					"undelegated_secondary_exposures": [
						{
							"gate": "3458750188",
							"gateValue": "false",
							"ruleID": "default"
						}
					]
				}
			},
			"sdkParams": {},
			"has_updates": true,
			"generator": "scrapi-nest",
			"time": 1792101160309,
			"company_lcut": 1792101160309,
			"evaluated_keys": {
				"userID": "e7c388664e5442e89f30b396d9fa7183",
				"stableID": "0cb69ef4-af6d-4d20-9da8-244976986ce1"
			},
			"hash_used": "djb2",
			"derived_fields": {
				"ip": "90.246.124.179",
				"country": "GB",
				"appVersion": "++Fortnite+Release-42.40-CL-59086525",
				"app_version": "++Fortnite+Release-42.40-CL-59086525",
				"browserName": "Other",
				"browserVersion": "0.0.0",
				"osName": "Windows",
				"osVersion": "0.0.0",
				"browser_name": "Other",
				"browser_version": "0.0.0",
				"os_name": "Windows",
				"os_version": "0.0.0"
			},
			"hashed_sdk_key_used": "1665495496",
			"can_record_session": true,
			"recording_blocked": false,
			"session_recording_rate": 1,
			"auto_capture_settings": {
				"disabled_events": {
					"page_view": true,
					"page_view_end": true,
					"click": true,
					"scroll": true,
					"session_start": true,
					"form_submit": true,
					"error": true,
					"performance": true,
					"dead_click": true,
					"rage_click": true,
					"web_vitals": true,
					"copy": true
				}
			},
			"target_app_used": "fn_client"
		})
	},

	statsigRgstr: function (req, res) {
		res.json({ "success": true })
	}


};