package org.niagads.genomics.service.services.GenomeBrowser;

import static org.gusdb.fgputil.FormatUtil.NL;

import java.util.List;
import java.util.Map;

import javax.sql.DataSource;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.log4j.Logger;
import org.gusdb.fgputil.db.runner.BasicResultSetHandler;
import org.gusdb.fgputil.db.runner.SQLRunner;

import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.WdkRuntimeException;
import org.gusdb.wdk.service.service.AbstractWdkService;
import org.json.JSONArray;
import org.json.JSONObject;

@Path("track/variant")
public class VariantTrackService extends AbstractWdkService {
    private static final Logger LOG = Logger.getLogger(VariantTrackService.class);

    private static final String DBSNP_TRACK = "dbSNP";
    private static final String DBSNP_COMMON_TRACK = "dbSNP_COMMON";
    private static final String ADSP_TRACK = "ADSP";
    private static final String ADSP_WES_TRACK = "ADSP_WES";
    private static final String ADSP_WGS_TRACK = "ADSP_WGS";

    private static final String CHROMOSOME_PARAM = "chromosome";
    private static final String TRACK_PARAM = "track";
    private static final String LOCATION_START_PARAM = "start";
    private static final String LOCATION_END_PARAM = "end";

    private static final String BIN_INDEX_CTE_SQL = "SELECT find_bin_index(?, ?, ?) AS bin_index";

    private static final String GRCh37_ROW_CTE_SQL = "SELECT jsonb_build_object(" + NL
            + "'chrom', chromosome," + NL
            + "'pos', location," + NL
            + "'id', v.record_primary_key," + NL
            + "'ref', split_part(metaseq_id, ':', 3)," + NL
            + "'alt', split_part(metaseq_id, ':', 4)," + NL
            + "'qual', '.'::text," + NL
            + "'filter', (cadd_scores->>'CADD_phred')::numeric," + NL
            + "'info', 'record=' || v.record_primary_key || ';consequence=' || v.adsp_ms_consequence || ';impact=' || (v.adsp_most_severe_consequence->>'impact')::text"
            + NL
            + ") AS row_json" + NL
            + "FROM AnnotatedVDB.Variant v, bin b" + NL
            + "WHERE b.bin_index @> v.bin_index" + NL
            + "AND int8range(?, ?, '[]') @> v.location" + NL
            + "AND v.chromosome = ?" + NL;

    private static final String DBSNP_VARIANT_FILTER = "AND ref_snp_id IS NOT NULL";
    private static final String DBSNP_COMMON_VARIANT_FILTER_SQL = "AND (vep_output->'input'->'info'->'COMMON')::integer::boolean";
    private static final String ADSP_VARIANT_FILTER_SQL = "AND is_adsp_variant";
    private static final String ADSP_WES_VARIANT_FILTER_SQL = "AND is_adsp_variant AND (other_annotation->>'GenomicsDB')::jsonb @> '["
            + '"' + "ADSP_WES" + '"' + "]'";

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    // @OutSchema("niagads.track.gwas.get-response")
    public Response buildResponse(String body,
            @QueryParam(TRACK_PARAM) String track,
            @QueryParam(CHROMOSOME_PARAM) String chromosome,
            @QueryParam(LOCATION_START_PARAM) Long locationStart,
            @QueryParam(LOCATION_END_PARAM) Long locationEnd) throws WdkModelException {
        LOG.info("Starting 'Variant Track' Service");

        JSONObject response = new JSONObject();
        response.put("track", track);

        try {
            JSONArray data = lookup(track, chromosome, locationStart, locationEnd);
            // LOG.debug("query result: " + data.toString());
            response.put("data", data);
        }

        catch (WdkRuntimeException ex) {
            throw new WdkModelException(ex);
        }

        return Response.ok(response).build();
    }

    private JSONArray lookup(String track, String chromosome, Long locationStart, Long locationEnd) throws WdkModelException {

        WdkModel wdkModel = getWdkModel();
        DataSource ds = wdkModel.getAppDb().getDataSource();
        BasicResultSetHandler handler = new BasicResultSetHandler();

        String projectId = wdkModel.getProperties().get("PROJECT_ID");

        String sql = buildDataQuery(track);

        LOG.debug("track = " + track + " // chr = " + chromosome + " // start = " + locationStart.toString()
                + " // end = " + locationEnd.toString());
        LOG.debug("sql: " + sql);
        SQLRunner runner = new SQLRunner(ds, sql, "track-variant-data-query");
        if (projectId.equals("GRCh38")) {
            if (track.startsWith("ADSP")) {
                String[] trackInfo = track.split("_");
                String releaseVersion = trackInfo[1].equals("17K")  ? "R3" : trackInfo[1];
                runner.executeQuery(new Object[] {chromosome, locationStart, locationEnd, releaseVersion}, handler);
            }
            else {
                runner.executeQuery(new Object[] {chromosome, locationStart, locationEnd}, handler);
            }
        }
        else {
            runner.executeQuery(
                new Object[] { chromosome, locationStart, locationEnd, locationStart, locationEnd, chromosome },
                handler);
        }   
        List<Map<String, Object>> results = handler.getResults();
        if (results.isEmpty()) {
            return new JSONArray();
        }

        String resultStr = (String) results.get(0).get("result");
        if (resultStr == "null" || resultStr == null) {
            return new JSONArray();
        }

        // LOG.debug("RESULT: " + resultStr);
        return new JSONArray(resultStr);
    }

    private String buildDataQuery(String track) throws WdkModelException {
        String projectId = getWdkModel().getProperties().get("PROJECT_ID");

        if (projectId.equals("GRCh38")) {
            if (track.startsWith("ADSP")) {
                return "SELECT get_adsp_variants(?,?::int,?::int, ?)::text AS result";
            } else if (track.equals(DBSNP_TRACK)) {
                return "SELECT get_dbsnp_variants(?,?::int,?::int)::text AS result";
            } else if (track.equals(DBSNP_COMMON_TRACK)) {
                return "SELECT get_dbsnp_common_variants(?,?::int,?::int)::text AS result";
            }

        } else {
            String cteSql = "WITH bin AS (" + BIN_INDEX_CTE_SQL + ")," + NL
                    + "vcfRows AS (" + NL
                    + GRCh37_ROW_CTE_SQL + NL;

            if (track.equals(ADSP_TRACK)) {
                cteSql += ADSP_VARIANT_FILTER_SQL + NL;
            } else if (track.equals(ADSP_WES_TRACK)) {
                cteSql += ADSP_WES_VARIANT_FILTER_SQL + NL;
            } else if (track.equals(DBSNP_TRACK)) {
                cteSql += DBSNP_VARIANT_FILTER + NL;
            } else if (track.equals(DBSNP_COMMON_TRACK)) {
                cteSql += DBSNP_COMMON_VARIANT_FILTER_SQL + NL;
            }

            cteSql += ")";

            // LOG.debug(cteSql);

            String querySql = cteSql + NL
                    + "SELECT jsonb_agg(row_json)::text AS result FROM vcfRows";

            return querySql;
        }
        return null;
    }
}