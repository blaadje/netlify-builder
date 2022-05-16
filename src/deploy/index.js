"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const architect_1 = require("@angular-devkit/architect");
const NetlifyAPI = require("netlify");
exports.default = architect_1.createBuilder((builderConfig, context) => __awaiter(void 0, void 0, void 0, function* () {
    context.reportStatus(`Executing deploy...`);
    context.logger.info(`Executing netlify deploy command ...... `);
    console.log('coucou', builderConfig);
    if (builderConfig.noBuild) {
        context.logger.info(`📦 Skipping build`);
    }
    else {
        const configuration = builderConfig.configuration || "production";
        const withDeps = Object.assign({ withDeps: builderConfig.withDeps });
        let overrides = Object.assign({}, (builderConfig.baseHref && {
            baseHref: builderConfig.baseHref,
        }));
        if (builderConfig.withDeps) {
            overrides = Object.assign(Object.assign({}, (builderConfig.baseHref && {
                baseHref: builderConfig.baseHref,
            })), { withDeps: builderConfig.withDeps });
        }
        if (!context.target) {
            throw new Error("Cannot build the application without a target");
        }
        const baseHref = builderConfig.baseHref
            ? `Your base-href: "${builderConfig.baseHref}`
            : "";
        const buildTarget = builderConfig.buildTarget
            ? builderConfig.buildTarget
            : "build";
        context.logger.info(`📦 Building "${context.target.project}". Configuration: "${configuration}". Build Command: ${buildTarget}. ${baseHref}`);
        const build = yield context.scheduleTarget({
            target: buildTarget,
            project: context.target.project || "",
            configuration,
        }, overrides);
        const buildResult = yield build.result;
        if (buildResult.success !== true) {
            context.logger.error(`❌ Application build failed`);
            return {
                error: `❌ Application build failed`,
                success: false,
            };
        }
        context.logger.info(`✔ Build Completed`);
    }
    const netlifyToken = process.env.NETLIFY_TOKEN || builderConfig.netlifyToken;
    if (netlifyToken === "" || netlifyToken === undefined) {
        context.logger.error("🚨 Netlify Token not found !");
        return { success: false };
    }
    let siteId = process.env.NETLIFY_API_ID || builderConfig.siteId;
    if (siteId === "" || siteId === undefined) {
        // site id is needed if the create option is false
        if (builderConfig.create === false) {
            context.logger.error("🚨 API ID (Site ID) not found !");
            return { success: false };
        }
    }
    const client = new NetlifyAPI(netlifyToken, {
        userAgent: "netlify/js-client",
        scheme: "https",
        host: "api.netlify.com",
        pathPrefix: "/api/v1",
        globalParams: {},
    });
    // let check if the site exists
    let site;
    try {
        // only when the site id is set
        if (siteId) {
            site = yield client.getSite({ site_id: siteId });
        }
    }
    catch (e) {
        switch (e.status) {
            case 404:
                context.logger.error(`❌ Site "${siteId}" : Not found`);
                // if the create is false - just return the error
                if (builderConfig.create !== true) {
                    return {
                        success: false,
                    };
                }
                break;
            case 401:
                context.logger.fatal("🚨 Netlify: Unauthorized Token");
                return {
                    success: false,
                };
            default:
                // for all other errors
                return {
                    error: e.message,
                    success: false,
                };
        }
    }
    // lets create the site
    if (!site && builderConfig.create) {
        try {
            context.logger.info(`Creating new site for the application`);
            site = yield client.createSite();
            siteId = site.id;
            context.logger.info(`✔ Site "${site.name}" (${siteId}) created. Please update the angular.json so on the next run we can re-deploy on the same site`);
        }
        catch (e) {
            context.logger.error("🚨 Unable to create the site");
            return {
                error: e.message,
                success: false,
            };
        }
    }
    // if we still don't have the site return with error
    if (!site) {
        context.logger.error("🚨 Unable to deploy as we don't have any context about the site");
        return {
            error: "🚨 Unable to deploy as we don't have any context about the site",
            success: false,
        };
    }
    // lets deploy the application to the site
    try {
        context.logger.info(`Deploying project from 📂 ./${builderConfig.netlifyConfig.outputPath}`);
        let config;
        if (builderConfig.netlifyConfig.functionsPath) {
            console.log(`Deploying functions from 📂 ./${builderConfig.netlifyConfig.functionsPath}`);
            config = Object.assign(Object.assign({}, config.netlifyConfig), { fnDir: builderConfig.netlifyConfig.functionsPath });
        }
        const response = yield client.deploy(siteId, builderConfig.netlifyConfig.outputPath, config);
        context.logger.info(`✔ Your updated site 🕸  is running at ${response.deploy.ssl_url}`);
        return { success: true };
    }
    catch (e) {
        context.logger.error(`❌ Deployment failed: ${e.message}`);
        return {
            error: e.message,
            success: false,
        };
    }
}));
//# sourceMappingURL=index.js.map