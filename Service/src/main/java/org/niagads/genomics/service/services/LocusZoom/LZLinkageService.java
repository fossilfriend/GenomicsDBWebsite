package org.niagads.genomics.service.services.LocusZoom;

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
import org.gusdb.fgputil.db.runner.SingleLongResultSetHandler;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.WdkRuntimeException;
import org.gusdb.wdk.service.service.AbstractWdkService;

@Path("locuszoom/linkage")
// @OutSchema("niagads.locuszoom.linkage.get-response")   
public class LZLinkageService extends AbstractWdkService {
    private static final Logger LOG = Logger.getLogger(LZLinkageService.class);

    private static final String REFERENCE_VARIANT_PARAM = "variant";
    private static final String POPULATION_PARAM = "population";

    private static final String LINKAGE_QUERY = "WITH id AS (SELECT ?::text AS source_id)," + NL
        + "Variant AS (SELECT * FROM id, get_variant_display_details(id.source_id) v)," + NL

        + "Linkage AS ("
        + "SELECT v.details->>'chromosome' AS chromosome," + NL
        + "(v.details->>'position')::int AS position," + NL 
        + "v.details->>'ref_snp_id' AS ref_snp_id, vl.*" + NL 
        + "FROM variant v, get_variant_linkage(v.record_primary_key) vl)," + NL 

        + "ExpandedLinkage AS (" + NL
        + "SELECT record_primary_key, chromosome," + NL
        + "(r.linkage->>'d_prime')::numeric AS d_prime," + NL
        + "(r.linkage->>'r_squared')::numeric AS r_squared," + NL
        + "(r.linkage->>'distance')::int AS distance," + NL
        + "CASE WHEN r.position = ((r.linkage->'locations')[0])::int" + NL
        + "THEN ((r.linkage->'locations')[1])::int ELSE ((r.linkage->'locations')[0])::int" + NL
        + "END AS linked_position," + NL
        + "CASE WHEN r.position = ((r.linkage->'locations')[0])::int " + NL
        + "THEN ((r.linkage->'minor_allele_frequency')[0])::numeric ELSE ((r.linkage->'minor_allele_frequency')[1])::numeric" + NL
        + "END AS minor_allele_frequency_ld_ref," + NL
        + "CASE WHEN r.position = ((r.linkage->'locations')[0])::int" + NL
        + "THEN ((r.linkage->'minor_allele_frequency')[1])::numeric ELSE ((r.linkage->'minor_allele_frequency')[0])::numeric" + NL
        + "END AS minor_allele_frequency," + NL
        + "CASE WHEN r.position = ((r.linkage->'locations')[0])::int" + NL
        + "THEN (r.linkage->'variants')[1] ELSE (r.linkage->'variants')[0]" + NL
        + "END AS linked_variant" + NL
        + "FROM linkage r" + NL
        + "WHERE (r.linkage->>'population_id')::int = ?)," + NL

        + "MappedLinkage AS (" + NL
        + "SELECT r.r_squared," + NL
        + "CASE WHEN r.linked_variant IS NULL" + NL
        + "THEN position_pk.record_primary_key" + NL
        + "ELSE r.linked_variant::text END AS linked_variant" + NL
        + "FROM ExpandedLinkage r," + NL
        + "find_variant_by_position(r.chromosome, r.linked_position, false) position_pk)" + NL
        + "SELECT jsonb_build_object('data'," + NL
        + "jsonb_build_object('linked_variant', jsonb_agg(m.linked_variant ORDER BY linked_variant)) ||" + NL
        + "jsonb_build_object('r_squared', jsonb_agg(m.r_squared ORDER BY linked_variant)))::text AS result" + NL
        + "FROM MappedLinkage m";


    @GET
    @Produces(MediaType.APPLICATION_JSON)
    // @OutSchema("niagads.locuszoom.linkage.get-response")
    public Response buildResponse(String body, @QueryParam(REFERENCE_VARIANT_PARAM) String variant, 
                                 @QueryParam(POPULATION_PARAM) String population) throws WdkModelException {
        LOG.info("Starting 'Locus Zoom Linkage' Service");
        String response = null;
        try {
            // query database for ld
            LOG.debug("Fetching linkage for variant:" + variant + "; population: " + population);

            long protocolAppNodeId = getPopulationProtocolAppNode(population);
            response = lookup(variant, protocolAppNodeId);
            //LOG.debug("query result: " + response);
        }

        catch(WdkRuntimeException ex) {
            throw new WdkModelException(ex);
        }
          
        return Response.ok(response).build();
    }

    private long getPopulationProtocolAppNode(String population) throws WdkModelException {

        String sql = "SELECT protocol_app_node_id" + NL
            + "FROM Study.ProtocolAppNode" + NL 
            + "WHERE source_id LIKE '1000%_" + population  + "_%LD%'" + NL 
            + "OR source_id LIKE '" + population + "_%LD'";
        
        if (population.equals("ADSP")) {
            sql += " LIMIT 1";
        }

        DataSource ds = getWdkModel().getAppDb().getDataSource();

        long result = new SQLRunner(ds, sql, "lz-linkage-pop-lookup").executeQuery(new SingleLongResultSetHandler())
        .orElseThrow(() -> new WdkModelException("No match found for the population: " + population));

        LOG.debug("DEBUG: Population - " + population + " -> " + result);
        return result;
    }

    private String lookup(String variant, long populationProtocolAppNode) {   
    
        WdkModel wdkModel = getWdkModel();
        DataSource ds = wdkModel.getAppDb().getDataSource();
        BasicResultSetHandler handler = new BasicResultSetHandler();
        
        //String variantLoc[] = variant.split(":");
        //String chromosome = "chr" + variantLoc[0];
     
        //LOG.debug("DEBUG: Query Params: variant = " + variant + "; pan = " + populationProtocolAppNode);
        //LOG.debug("DEBUG: sql = " + LINKAGE_QUERY);

        SQLRunner runner = new SQLRunner(ds, LINKAGE_QUERY, "linkage-query");
        runner.executeQuery(new Object[] {variant, populationProtocolAppNode}, handler);

        List<Map<String, Object>> results = handler.getResults();
        if (results.isEmpty()) {
            return "{}";
        }

        String resultStr = (String) results.get(0).get("result");
        if (resultStr == "null" || resultStr == null) {
            return "{}";
        }

        //LOG.debug("RESULT:  " + resultStr);
        return resultStr;
    }

}
