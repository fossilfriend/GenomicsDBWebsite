import { RecordTableProperties } from "./_recordTableProperties";

export const _geneTableProperties: { [name: string]: RecordTableProperties } = {
    ad_variants_from_gwas: {
        filters: {
            pvalue: "pvalue",
            adsp_variant_flag: "pie",
            gene_impact: "pie",
            gene_consequence: "pie",
            relative_position: "pie",
            population: "pie",
            biomarker: "select",
            tissue: "select",
            covariates: "multi_select",
        },
        filterGroups: [
            { label: "Statistics", columns: ["pvalue"], defaultOpen: true },
            { label: "Position", columns: ["relative_position"] },
            { label: "Annotation", columns: ["adsp_variant_flag", "gene_impact", "gene_consequence"] },
            { label: "Phenotype", columns: ["population", "biomarker", "genotype", "tissue", "covariates"] },
        ],
        defaultFilter: "pvalue",
        hiddenColumns: [
            "population",
            "diagnosis",
            "neuropathology",
            "covariates",
            "gender",
            "genotype",
            "biomarker",
            "tissue",
        ],
        requiredColumns: ["track", "variant_link", "pvalue"],
        defaultOpen: true,
        canFilter: true,
        canToggleColumns: true,
        sortedBy: [{ id: "pvalue", descending: false }],
        accessors: { "adsp_variant_flag": "BooleanFlag", "pvalue": "ScientificNotation", "variant_link": "Link", "track": "Link"}
    },
    other_variants_from_gwas: {
        filters: {
            pvalue: "pvalue",
            adsp_variant_flag: "pie",
            gene_impact: "pie",
            gene_consequence: "pie",
            relative_position: "pie",
            diagnosis: "pie",
            neuropathology: "pie",
            population: "pie",
            biomarker: "select",
            tissue: "select",
            covariates: "multi_select",
        },
        filterGroups: [
            { label: "Statistics", columns: ["pvalue"], defaultOpen: true },
            { label: "Position", columns: ["relative_position"] },
            { label: "Annotation", columns: ["adsp_variant_flag", "gene_impact", "gene_consequence"] },
            {
                label: "Phenotype",
                columns: ["population", "diagnosis", "neuropathology", "biomarker", "genotype", "tissue", "covariates"],
            },
        ],
        defaultFilter: "pvalue",
        hiddenColumns: ["population", "covariates", "gender", "genotype", "biomarker", "tissue"],
        requiredColumns: ["track", "variant_link", "pvalue", "diagnosis", "neuropathology"],
        defaultOpen: false,
        canFilter: true,
        canToggleColumns: true,
        sortedBy: [{ id: "pvalue", descending: false }],
        accessors: { "adsp_variant_flag": "BooleanFlag", "pvalue": "ScientificNotation", "variant_link": "Link", "track": "Link"}
    },
    ad_variants_from_catalog: {
        filters: {
            pvalue: "pvalue",
            adsp_variant_flag: "pie",
            gene_impact: "pie",
            gene_consequence: "pie",
            relative_position: "pie",
            source: "select",
        },
        filterGroups: [
            { label: "Statistics", columns: ["pvalue"], defaultOpen: true },
            { label: "Position", columns: ["relative_position"] },
            { label: "Annotation", columns: ["source", "adsp_variant_flag", "gene_impact", "gene_consequence"] },
        ],
        defaultFilter: "pvalue",
        hiddenColumns: ["source", "sample", "replicate_sample", "frequency", "gene_impact", "gene_consequence"],
        requiredColumns: ["variant_link", "pvalue", "trait", "study", "pubmed_id"],
        defaultOpen: false,
        canFilter: true,
        canToggleColumns: true,
        sortedBy: [{ id: "pvalue", descending: false }],
        accessors: { "adsp_variant_flag": "BooleanFlag", "pvalue": "ScientificNotation", "variant_link": "Link", "pubmed_id": "Link"}
    },
    other_variants_from_catalog: {
        filters: {
            pvalue: "pvalue",
            adsp_variant_flag: "pie",
            gene_impact: "pie",
            gene_consequence: "pie",
            relative_position: "pie",
            source: "select",
        },
        filterGroups: [
            { label: "Statistics", columns: ["pvalue"], defaultOpen: true },
            { label: "Position", columns: ["relative_position"] },
            { label: "Annotation", columns: ["source", "adsp_variant_flag", "gene_impact", "gene_consequence"] },
        ],
        hiddenColumns: ["source", "sample", "replicate_sample", "frequency", "gene_impact", "gene_consequence"],
        requiredColumns: ["variant_link", "pvalue", "trait", "study", "pubmed_id"],
        defaultOpen: false,
        canFilter: true,
        canToggleColumns: true,
        sortedBy: [{ id: "pvalue", descending: false }],
        accessors: { "adsp_variant_flag": "BooleanFlag", "pvalue": "ScientificNotation", "variant_link": "Link", "pubmed_id": "Link"}
        
    },
    go_terms: {
        filters: {
            go_evidence_code: "select",
            ontology: "select",
        },
        filterGroups: [{ label: "Annotation", columns: ["go_evidence_code", "ontology"], defaultOpen: true }],
        defaultOpen: false,
        canFilter: true,
        canToggleColumns: false,
        accessors: {"go_accession": "Link"}
    },
    pathways: {
        defaultOpen: false,
        canFilter: true,
        canToggleColumns: false,
        accessors: {"accession": "Link"}
    },
};
