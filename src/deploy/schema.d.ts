interface netlifyOptions {
    fnDir?: string; // path to a folder of functions to deploy
    branch?: string; // branch to pass onto the netlify api
    configPath?: string; // path to a netlify.toml file to include in the deploy (e.g. redirect support for manual deploys)
    draft?: boolean; // draft deploy or production deploy
    message?: undefined; // a short message to associate with the deploy
    deployTimeout?: number; // 20 mins
    parallelHash?: number; // number of parallel hashing calls
    parallelUpload?: number; // number of files to upload in parallel
    maxRetry?: number; // number of times to try on failed file uploads
    filter?: (filepath: string) => boolean;
    tmpDir?: string
    statusCb?: (statusObj) => void;
    // passing a deployId will update an existing deploy based on the provided options
    deployId?: string;
}

export interface Schema extends netlifyOptions {
    buildTarget?: string;
    outputPath: string;
    configuration?: string;
    noBuild?: boolean;
    netlifyToken?: string;
    siteId?: string;
    baseHref?: string;
    create?: boolean;
    withDeps?: boolean;
}
