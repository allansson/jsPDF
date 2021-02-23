/* global describe, it, jsPDF, comparePdf */

const render = (markup, opts = {}, doc) =>
  new Promise(resolve => {
    doc = doc || new jsPDF({ floatPrecision: 2 });

    doc.html(markup, { ...opts, callback: resolve });
  });

function toFontFaceRule(fontFace) {
  const srcs = fontFace.src.map(
    src => `url('${src.url}') format('${src.format}')`
  );

  const cssProps = [
    `font-family: ${fontFace.family}`,
    fontFace.stretch && `font-stretch: ${fontFace.stretch}`,
    fontFace.style && `font-style: ${fontFace.style}`,
    fontFace.weight && `font-weight: ${fontFace.weight}`,
    `src: ${srcs.join("\n")}`
  ];

  return `
    @font-face {
      ${cssProps.filter(a => a).join(";\n")} 
    }
  `;
}

describe("Module: html", function() {
  if (
    (typeof isNode != "undefined" && isNode) ||
    navigator.userAgent.indexOf("Chrome") < 0
  ) {
    return;
  }
  beforeAll(loadGlobals);
  it("html loads html2canvas asynchronously", async () => {
    const doc = await render("<h1>Basic HTML</h1>");

    comparePdf(doc.output(), "html-basic.pdf", "html");
  });

  it("renders font-faces", async () => {
    const opts = {
      fontFaces: [
        {
          family: "Roboto",
          weight: 400,
          src: [
            {
              url: "base/test/reference/fonts/Roboto/Roboto-Regular.ttf",
              format: "truetype"
            }
          ]
        },
        {
          family: "Roboto",
          weight: 700,
          src: [
            {
              url: "base/test/reference/fonts/Roboto/Roboto-Bold.ttf",
              format: "truetype"
            }
          ]
        },
        {
          family: "Roboto",
          weight: "bold",
          style: "italic",
          src: [
            {
              url: "base/test/reference/fonts/Roboto/Roboto-BoldItalic.ttf",
              format: "truetype"
            }
          ]
        },
        {
          family: "Roboto",
          style: "italic",
          src: [
            {
              url: "base/test/reference/fonts/Roboto/Roboto-Italic.ttf",
              format: "truetype"
            }
          ]
        }
      ]
    };

    const doc = await render(
      `
      <div style="width: 200px; height: 200px;"> 
        <style>
          ${opts.fontFaces.map(toFontFaceRule)}

          body {
            font-size: 14px;
          }
 
          .sans-serif {
            font-family: sans-serif;
          }

          .roboto {
            font-family: 'Roboto'
          }
          
          .generic {
            font-family: monospace; 
          } 

          .default {
            font-family: serif;
          }

          .bold {
            font-weight: bold;
          }
 
          .italic {
            font-style: italic;
          }
        </style>

        <p class="default">
        The quick brown fox jumps over the lazy dog (default)
        <p>
        <p class="generic">
        The quick brown fox jumps over the lazy dog (generic)
        <p>
        <p class="sans-serif">
        The quick brown fox jumps over the lazy dog (sans-serif)
        <p>

        <div class="roboto">
          <p>
          The quick brown fox jumps over the lazy dog (roboto)
          <p>
          <p class="bold">
          The quick brown fox jumps over the lazy dog (roboto bold)
          <p>
          <p class="italic">
          The quick brown fox jumps over the lazy dog (roboto italic)
          <p>
          <p class="bold italic">
          The quick brown fox jumps over the lazy dog (roboto bold italic)
          <p> 
        </div>
      </div>
    `,
      opts
    );

    comparePdf(doc.output(), "html-font-faces.pdf", "html");
  });

  describe("paging", () => {
    it('handles paging automatically when paging is set to "auto"', async () => {
      const doc = await render(
        `
        <div style="width: 200px; height: 500px">First</div>
        <div style="width: 200px; height: 500px">Second</div>
        <div style="width: 200px; height: 500px">Third</div>
        <div style="width: 200px; height: 500px">Fourth</div>
      `,
        {
          paging: "auto"
        }
      );

      comparePdf(doc.output(), "html-paging-auto.pdf", "html");
    });

    it('starts from current page and automatically pages when paging is set to "auto"', async () => {
      const doc = new jsPDF({ floatPrecision: 2 }).addPage().addPage();

      await render(
        `
        <div>
        <div style="width: 200px; height: 500px">First</div>
        <div style="width: 200px; height: 500px">Second</div>
        <div style="width: 200px; height: 500px">Third</div>
        <div style="width: 200px; height: 500px">Fourth</div>
        </div>
      `,
        {
          paging: "auto"
        },
        doc
      );

      comparePdf(doc.output(), "html-paging-auto-from-current.pdf", "html");
    });

    it('does not page when paging is set to "manual"', async () => {
      const doc = await render(
        `
        <div style="height: 500px">First</div>
        <div style="height: 500px">Second</div>
        <div style="height: 500px">Third</div>
        <div style="height: 500px">Fourth</div>
      `,
        {
          paging: "none"
        }
      );

      expect(doc.internal.getNumberOfPages()).toBe(1);
      comparePdf(doc.output(), "html-paging-manual.pdf", "html");
    });

    it('starts drawning from current when paging is set to "manual"', async () => {
      const doc = new jsPDF({ floatPrecision: 2 });

      await render(
        `
        <div>First</div>
      `,
        {
          paging: "none"
        },
        doc
      );

      doc.addPage();

      await render(
        `
        <div>Second</div>
      `,
        {
          paging: "none"
        },
        doc
      );

      doc.addPage();

      await render(
        `
        <div>Third</div>
      `,
        {
          paging: "none"
        },
        doc
      );

      expect(doc.internal.getNumberOfPages()).toBe(3);
      comparePdf(doc.output(), "html-paging-adding-pages.pdf", "html");
    });
  });
});
