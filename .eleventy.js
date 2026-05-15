const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(syntaxHighlight);

  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/assets");

  eleventyConfig.addCollection("problems", function (api) {
    return api.getFilteredByGlob("src/problems/*.md").sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("projects", function (api) {
    return api.getFilteredByGlob("src/projects/*.md").sort((a, b) => {
      if (a.data.status === "current" && b.data.status !== "current") return -1;
      if (b.data.status === "current" && a.data.status !== "current") return 1;
      return b.date - a.date;
    });
  });

  eleventyConfig.addFilter("dateFormat", function (date) {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long" });
  });

  eleventyConfig.addFilter("tagsToString", function (tags) {
    return (tags || []).join(", ");
  });

  return {
    pathPrefix: "/portfolio/",
    dir: {
      input: "src",
      output: "_site",
      layouts: "_layouts",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
  };
};
