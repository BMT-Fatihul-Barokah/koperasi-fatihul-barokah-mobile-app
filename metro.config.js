const { getDefaultConfig } = require('expo/metro-config');
 
module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  const { transformer, resolver } = config;

  // Temporarily disable SVG transformer to fix the RNSVGPath error
  // We'll use regular image assets instead of SVG for now
  config.transformer = {
    ...transformer,
    // Commenting out SVG transformer
    // babelTransformerPath: require.resolve('react-native-svg-transformer'),
  };
  
  config.resolver = {
    ...resolver,
    // Keep svg in assetExts instead of sourceExts
    assetExts: [...resolver.assetExts],
    sourceExts: [...resolver.sourceExts],
  };

  // Increase timeouts for better network resilience
  config.server = {
    ...config.server,
    port: 8081,
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        // Increase timeout for all requests
        req.setTimeout(30000); // 30 seconds
        res.setTimeout(30000); // 30 seconds
        return middleware(req, res, next);
      };
    },
  };

  return config;
})();