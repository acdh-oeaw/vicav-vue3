import { computed } from "vue";
import * as z from "zod";

import type { Author, AuthorRef, Person, TEI, TeiCorpus, TeiHeader } from "@/lib/api-client";
import { type simpleTEIMetadata, type place, SimpleTEIMetadataSchema, placeSchema  } from "@/types/teiCorpus.ts";
import dataTypes from "@/config/dataTypes.ts";

const TeiCorpusSchema = z.fromJSONSchema(useOpenapiSchema("TeiCorpus")!) as z.ZodType<TeiCorpus>;
const AuthorRefSchema = z.fromJSONSchema(useOpenapiSchema("AuthorRef")!) as z.ZodType<AuthorRef>;
const AuthorSchema = z.fromJSONSchema(useOpenapiSchema('Author')!) as z.ZodType<Author>;

export const useTeiHeadersStore = defineStore("use-tei-headers-store", () => {
	const { data: projectData, suspense } = useProjectInfo();

	const initialize = async () => {
		await suspense();
	};

	const rawItems = computed(() => {
		const parsedItems: Array<TeiCorpus> = [];
		(projectData.value?.projectConfig?.staticData?.table ?? []).forEach((item) => {
			const parsedItem = TeiCorpusSchema.safeParse(item);
			if (parsedItem.success) {
				parsedItems.push(parsedItem.data);
			} else {
				console.log(parsedItem.error);
			}
		});
		return parsedItems;
	});

	const extractPersons = function (item: TEI, corpusMetadata: TeiHeader | undefined) {
		const corpusPersons = corpusMetadata?.profileDesc?.particDesc?.listPerson;
		const results = [];
		if (corpusPersons && item.teiHeader?.profileDesc?.particDesc?.listPerson) {
			const persons = item.teiHeader.profileDesc.particDesc.listPerson
				.map((item: Person) => {
					return (item["@sameAs"] ?? item.$ ?? "").replace("corpus:", "");
				})
				.filter((item: string | undefined) => item);
			for (const personId of persons) {
				const person = corpusPersons.find((item: Person) => item["@id"] === personId);
				if (person)
					results.push({
						name: person["@id"] ?? "",
						sex: person["@sex"] ?? "",
						age: person["@age"] ?? "",
					});
			}
		}
		return results;
	};

	const extractMetadata = function (
		item: TEI,
		dataType: string,
		corpusMetadata: TeiHeader | undefined,
	) {
		const dataTypeObject = Object.values(dataTypes).find(
			(dataTypeObject) => dataTypeObject.collection === dataType,
		)
		const h = item.teiHeader;

		// duration
		const duration = h?.fileDesc.sourceDesc.recordingStmt?.recording ? parseInt(
			h.fileDesc.sourceDesc.recordingStmt.recording["@dur-iso"]
				.replace("PT", "")
				.replace(".0", "")) : undefined;
		const durHours = duration ? Math.floor(duration / 3600) : undefined;
		const durSeconds = duration ? Math.floor(duration % 60) : undefined;
		const durMinutes = duration ? Math.floor(((duration % 3600) - durSeconds!) / 60) : undefined;

		// resp
		const persName = h?.fileDesc.sourceDesc.recordingStmt?.recording.respStmt.persName;
		const respPerson = corpusMetadata?.fileDesc.titleStmt.respStmts?.find((resp) => {
				const resp1 = AuthorRefSchema.safeParse(resp.persName).data?.["@ref"];
				const resp2 = AuthorRefSchema.safeParse(persName).data?.["@ref"];
				return resp1 === resp2;
		});


		const parsedItem = SimpleTEIMetadataSchema.safeParse({
			id: item["@id"] ?? h?.fileDesc.publicationStmt.idno?.$ ?? "no_id",
			recordingDate: h?.fileDesc.sourceDesc.recordingStmt?.recording.date
				? h.fileDesc.sourceDesc.recordingStmt.recording.date["@when"]
				: undefined,
			pubDate: h?.fileDesc.publicationStmt.date?.$ ?? "unknown",
			dataType: dataTypeObject ? dataTypeObject.targetType : undefined,
			place: {
				settlement: h?.profileDesc?.settingDesc?.place?.settlement?.name[0]
					? h.profileDesc.settingDesc.place.settlement.name[0].$
					: undefined,
				country: h?.profileDesc?.settingDesc?.place?.country?.$ ?? undefined,
				region: h?.profileDesc?.settingDesc?.place?.region?.$ ?? undefined,
			},
			duration: duration ? `${durHours ? `${String(durHours).padStart(2, "0")}:` : ""}${String(durMinutes).padStart(2, "0")}:${String(durSeconds).padStart(2, "0")}` : undefined,
			audioAvailability: h?.fileDesc.publicationStmt.availability?.["@status"] ?? "unknown",
		});
		if(parsedItem.success) return parsedItem.data;
		else return null;
	}




	const simpleItems: ComputedRef<Array<simpleTEIMetadata>> = computed(() => {
		const corpusMetadata = rawItems.value
			.find((item) => item.teiHeader && item["@id"] === "vicav_corpus")?.teiHeader;
		const data = rawItems.value
			.map((dataTypeTEIs) => {
				return dataTypeTEIs.TEIs?.map((item) =>
					extractMetadata(item, dataTypeTEIs["@id"] ?? "", corpusMetadata),
				);
			})
			.filter((i) => i !== undefined);
		return data;
	});

	return {
		initialize,
		rawItems,
		simpleItems,
	};
});
