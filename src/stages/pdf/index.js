import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

/**
 * @module pdfStage
 * @description
 * PDF Stage for converting an HTML file into a PDF using PrinceXML.
 *
 * This stage performs the following steps:
 * 1. Locates the previously generated HTML file (from the writeHtml stage) at:
 *    build/<buildType>/index.html.
 * 2. Reads PDF-related options from `stageConfig.config`. These options are converted
 *    into command-line arguments for the PrinceXML tool.
 * 3. Invokes PrinceXML's "prince-books" command to generate a final PDF at:
 *    build/<buildType>/book.pdf.
 *
 * The stage receives two configuration objects:
 *   - {@link module:globalConfig} (globalConfig.meta contains merged metadata)
 *   - {@link module:stageConfig} which is expected to have a structure:
 *     { config: { ... }, meta: { ... } }
 *
 * @param {Object} manuscript - The manuscript object, which includes at least the property `buildType`.
 * @param {Object} context - An object containing configuration data.
 * @param {Object} context.stageConfig - Stage-specific configuration for this stage. Expected to have a `config` key.
 * @param {Object} context.globalConfig - Global configuration (e.g., merged metadata).
 * @returns {Promise<Object>} Returns the manuscript object unmodified on success.
 *
 * @example
 * // In your book.config.yml, you might define:
 * //
 * // global:
 * //   stages:
 * //     - name: pdf
 * //       config:
 * //         landscape: true
 * //         media: A4
 * //
 * // buildPipelines:
 * //   pdf:
 * //     stages:
 * //       - name: ejs
 * //       - name: markdown
 * //       - name: theme
 * //       - name: writeHtml
 * //       - name: pdf
 * //
 * // When the pdf stage runs, it will take the options from stageConfig.config and pass them
 * // as command-line arguments to PrinceXML (e.g., --landscape=true --media=A4).
 */
export async function run(manuscript, { stageConfig, globalConfig }) {
  const buildType = manuscript.buildType || 'pdf';

  // Locate the HTML file generated by the writeHtml stage.
  const inputHtmlPath = path.join(process.cwd(), 'build', buildType, 'index.html');

  // Ensure the HTML file exists before proceeding.
  if (!fs.existsSync(inputHtmlPath)) {
    console.error(chalk.red(`\n🚨 Could not find HTML file at ${inputHtmlPath}`));
    throw new Error('PDF stage failed because no HTML was found.');
  }

  // Define the output path for the PDF.
  const outputPdfPath = path.join(process.cwd(), 'build', buildType, 'book.pdf');

  // Convert stage configuration options into PrinceXML CLI arguments.
  // Here we use the merged options from stageConfig.config.
  let pdfOptions = [];
  if (stageConfig && stageConfig.config) {
    for (const [key, value] of Object.entries(stageConfig.config)) {
      pdfOptions.push(`--${key}=${value}`);
    }
  }

  // If needed, you can also merge additional options from globalConfig here.
  // For example:
  // const extraOptions = globalConfig.myPdfSettings || {};
  // for (const [key, value] of Object.entries(extraOptions)) {
  //   pdfOptions.push(`--${key}=${value}`);
  // }

  // Run PrinceXML via the prince-books command-line tool.
  try {
    console.log(chalk.blue(`\nStarting PDF generation with PrinceXML...`));
    const cmd = `prince-books ${pdfOptions.join(' ')} "${inputHtmlPath}" -o "${outputPdfPath}"`;
    console.log(chalk.white(`\n> ${cmd}`));
    execSync(cmd, { stdio: 'inherit' });
    console.log(chalk.green(`\n✅ PDF successfully created at: ${path.relative(process.cwd(), outputPdfPath)}`));
  } catch (err) {
    console.error(chalk.red('Error generating PDF with PrinceXML:'), err);
    throw err;
  }

  // Return the manuscript object unchanged.
  return manuscript;
}