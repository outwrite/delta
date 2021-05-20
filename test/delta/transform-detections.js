/* eslint-disable @typescript-eslint/camelcase */
const Delta = require('../../dist/Delta');

/**
 * NOTE: Assumes compose() works as intended...
 * - when adding a new detection, it "removed" any overlapping detections first
 * - gets rid of any partially deleted detectionIds (either through "null" or "delete")
 * - get rid of any detections that have been split by an insert
 */

function transformX(left, right) {
  return [right.transform(left, true), left.transform(right, false)];
}

describe('validated detections', function () {
  describe('insert inside of detection retain', function () {
    const a = new Delta().retain(1).insert('X');
    const b = new Delta().retain(2, { detectionId: '123' });
    const a_ = new Delta().retain(1).insert('X'); // original
    // var b_ = new Delta().retain(1, { detectionId: '123' }).retain(1).retain(1, { detectionId: '123' }); // original
    // var b_ = new Delta().retain(3); // modified - we dont need to specifcally "null" anything
    const b_ = new Delta(); // chop

    it('transforms', function () {
      expect(a.transform(b, true)).toEqual(b_);
      expect(b.transform(a, true)).toEqual(a_);
      expect(a.transform(b, false)).toEqual(b_);
      expect(b.transform(a, false)).toEqual(a_);
    });

    it('compose + transform', function () {
      const doc = new Delta().insert('ABC');
      const final = new Delta().insert('AXBC');
      expect(doc.compose(a).compose(b_, true)).toEqual(final);
      expect(doc.compose(b).compose(a_, false)).toEqual(final);
      expect(doc.compose(a).compose(b_, false)).toEqual(final);
      expect(doc.compose(b).compose(a_, true)).toEqual(final);
    });
  });

  describe('det insert & delete [not modified]', function () {
    const a = new Delta().insert('X', { detectionId: '123' });
    const b = new Delta().delete(1);
    const a_ = new Delta().insert('X', { detectionId: '123' });
    const b_ = new Delta().retain(1).delete(1);

    it('transforms', function () {
      expect(a.transform(b, true)).toEqual(b_);
      expect(b.transform(a, true)).toEqual(a_);
      expect(a.transform(b, false)).toEqual(b_);
      expect(b.transform(a, false)).toEqual(a_);
    });

    it('compose + transform', function () {
      const doc = new Delta().insert('ABC', { detectionId: '234' });
      const final = new Delta()
        .insert('X', { detectionId: '123' })
        .insert('BC');
      expect(doc.compose(a).compose(b_, true)).toEqual(final);
      expect(doc.compose(b).compose(a_, false)).toEqual(final);
      expect(doc.compose(a).compose(b_, false)).toEqual(final);
      expect(doc.compose(b).compose(a_, true)).toEqual(final);
    });
  });

  describe('det retain & delete', function () {
    const a = new Delta().retain(2, { detectionId: '123' });
    const b = new Delta().delete(1);
    // var a_ = new Delta().retain(1, { detectionId: '123' }); // original
    // var a_ = new Delta().retain(1); // modified
    const a_ = new Delta(); // chop
    const b_ = new Delta().delete(1); // same as original

    it('transforms', function () {
      expect(a.transform(b, true)).toEqual(b_);
      expect(b.transform(a, true)).toEqual(a_);
      expect(a.transform(b, false)).toEqual(b_);
      expect(b.transform(a, false)).toEqual(a_);
    });

    it('compose + transform', function () {
      const doc = new Delta().insert('ABC');
      const final = new Delta().insert('BC');
      expect(doc.compose(a).compose(b_, true)).toEqual(final);
      expect(doc.compose(b).compose(a_, false)).toEqual(final);
      expect(doc.compose(a).compose(b_, false)).toEqual(final);
      expect(doc.compose(b).compose(a_, true)).toEqual(final);
    });
  });

  describe('detection retain & detection retain (always ignore one of them)', function () {
    const a = new Delta().retain(2).retain(2, { detectionId: '123' });
    const b = new Delta().retain(3, { detectionId: '234' });

    const a_a = new Delta().retain(2).retain(2, { detectionId: '123' });
    // var a_b = new Delta().retain(3).retain(1, { detectionId: '123' }); // original
    // var a_b = new Delta().retain(3).retain(1); // modified
    const a_b = new Delta(); // chop

    const b_b = new Delta().retain(3, { detectionId: '234' });
    // var b_a = new Delta().retain(2, { detectionId: '234' }); // original
    // var b_a = new Delta().retain(2); // modified
    const b_a = new Delta(); // chop

    it('transforms', function () {
      expect(a.transform(b, true)).toEqual(b_a);
      expect(b.transform(a, true)).toEqual(a_b);
      expect(a.transform(b, false)).toEqual(b_b);
      expect(b.transform(a, false)).toEqual(a_a);
    });

    it('compose + transform with A priority', function () {
      const doc = new Delta().insert('ABCD');
      const final = new Delta()
        .insert('AB')
        .insert('CD', { detectionId: '123' });
      expect(doc.compose(a).compose(b_a)).toEqual(final);
      expect(doc.compose(b).compose(a_a)).toEqual(final);
    });

    it('compose + transform with B Priority', function () {
      const doc = new Delta().insert('ABCD');
      const final = new Delta()
        .insert('ABC', { detectionId: '234' })
        .insert('D');
      expect(doc.compose(a).compose(b_b)).toEqual(final);
      expect(doc.compose(b).compose(a_b)).toEqual(final);
    });
  });

  describe('detection null + retain detection', function () {
    const a = new Delta().retain(3, { detectionId: null });
    const b = new Delta().retain(1).retain(4, { detectionId: '123' });

    const a_a = new Delta().retain(3, { detectionId: null });
    const a_b = new Delta().retain(1, { detectionId: null });

    const b_b = new Delta().retain(1).retain(4, { detectionId: '123' });
    // var b_a = new Delta().retain(3).retain(1, { detectionId: '123' }); // original
    // var b_a = new Delta().retain(3).retain(1); // modified
    const b_a = new Delta(); // chop

    it('transforms', function () {
      expect(a.transform(b, true)).toEqual(b_a);
      expect(b.transform(a, true)).toEqual(a_b);
      expect(a.transform(b, false)).toEqual(b_b);
      expect(b.transform(a, false)).toEqual(a_a);
    });

    it('compose + transform with A priority', function () {
      const doc = new Delta()
        .insert('ABC', { detectionId: '234' })
        .insert('DE');
      const final = new Delta().insert('ABCDE');
      expect(doc.compose(a).compose(b_a)).toEqual(final);
      expect(doc.compose(b).compose(a_a)).toEqual(final);
    });

    it('compose + transform with B Priority', function () {
      const doc = new Delta()
        .insert('ABC', { detectionId: '234' })
        .insert('DE');
      const final = new Delta()
        .insert('A')
        .insert('BCDE', { detectionId: '123' });
      expect(doc.compose(a).compose(b_b)).toEqual(final);
      expect(doc.compose(b).compose(a_b)).toEqual(final);
    });
  });

  describe('detection null + delete [not modified]', function () {
    const a = new Delta().retain(3, { detectionId: null });
    const b = new Delta().delete(1);

    const a_ = new Delta().retain(2, { detectionId: null });
    const b_ = new Delta().delete(1);

    it('transforms', function () {
      expect(a.transform(b, true)).toEqual(b_);
      expect(b.transform(a, true)).toEqual(a_);
      expect(a.transform(b, false)).toEqual(b_);
      expect(b.transform(a, false)).toEqual(a_);
    });

    it('compose + transform', function () {
      const doc = new Delta().insert('ABC', { detectionId: '123' });
      const final = new Delta().insert('BC');
      expect(doc.compose(a).compose(b_, true)).toEqual(final);
      expect(doc.compose(b).compose(a_, false)).toEqual(final);
      expect(doc.compose(a).compose(b_, false)).toEqual(final);
      expect(doc.compose(b).compose(a_, true)).toEqual(final);
    });
  });

  describe('detection null + insert [not modified]', function () {
    const a = new Delta().retain(3, { detectionId: null });
    const b = new Delta().insert('X');

    const a_ = new Delta().retain(1).retain(3, { detectionId: null });
    const b_ = new Delta().insert('X');

    it('transforms', function () {
      expect(a.transform(b, true)).toEqual(b_);
      expect(b.transform(a, true)).toEqual(a_);
      expect(a.transform(b, false)).toEqual(b_);
      expect(b.transform(a, false)).toEqual(a_);
    });

    it('compose + transform', function () {
      const doc = new Delta().insert('ABC', { detectionId: '123' });
      const final = new Delta().insert('XABC');
      expect(doc.compose(a).compose(b_, true)).toEqual(final);
      expect(doc.compose(b).compose(a_, false)).toEqual(final);
      expect(doc.compose(a).compose(b_, false)).toEqual(final);
      expect(doc.compose(b).compose(a_, true)).toEqual(final);
    });
  });

  describe('retain + retain & delete (need to null)', function () {
    const a = new Delta()
      .retain(1, { detectionId: '123' })
      .delete(1)
      .retain(1, { detectionId: '123' });
    const b = new Delta().retain(4, { detectionId: '234' });

    const a_a = new Delta()
      .retain(1, { detectionId: '123' })
      .delete(1)
      .retain(1, { detectionId: '123' });
    const a_b = new Delta().retain(1).delete(1);

    // var b_b = new Delta().retain(4, { detectionId: '234' }); // original
    // var b_b = new Delta().retain(2, { detectionId: null }).retain(2); // modified
    const b_b = new Delta().retain(2, { detectionId: null }); // chop
    const b_a = new Delta();

    it('transforms', function () {
      // expect(a.transform(b, true)).toEqual(b_a);
      // expect(b.transform(a, true)).toEqual(a_b);
      expect(a.transform(b, false)).toEqual(b_b);
      // expect(b.transform(a, false)).toEqual(a_a);
    });

    it('compose + transform with A priority', function () {
      const doc = new Delta().insert('ABCDE');
      const final = new Delta()
        .insert('AC', { detectionId: '123' })
        .insert('DE');
      expect(doc.compose(a).compose(b_a)).toEqual(final);
      expect(doc.compose(b).compose(a_a)).toEqual(final);
    });

    it('compose + transform with B Priority', function () {
      const doc = new Delta().insert('ABCDE');
      const final = new Delta().insert('ACDE');
      expect(doc.compose(a).compose(b_b)).toEqual(final);
      expect(doc.compose(b).compose(a_b)).toEqual(final);
    });
  });

  it('sdasd', function () {
    const sop = new Delta([
      { insert: 'He' },
      { retain: 3 },
      { attributes: { italic: true }, insert: 1 },
      { retain: 2 },
      { delete: 3 },
      {
        retain: 2,
        attributes: { color: 'purple', bold: null, italic: true },
      },
    ]);

    const cop = new Delta([
      { retain: 1, attributes: { italic: null, detectionId: null } },
      {
        retain: 3,
        attributes: {
          color: 'yellow',
          bold: null,
          italic: true,
          detectionId: '6',
        },
      },
      { insert: 'thrtheough' },
    ]);

    expect(cop.transform(sop)).toEqual(
      new Delta([
        { insert: 'He' },
        { retain: 3 },
        { attributes: { italic: true }, insert: 1 },
        { retain: 12 },
        { delete: 3 },
        {
          retain: 2,
          attributes: { color: 'purple', bold: null, italic: true },
        },
      ]),
    );
    expect(sop.transform(cop)).toEqual(
      new Delta([
        { retain: 2 },
        { attributes: { italic: null, detectionId: null }, retain: 1 },
        {
          retain: 2,
          attributes: { color: 'yellow', bold: null, italic: true },
        },
        { retain: 1 },
        {
          retain: 1,
          attributes: { color: 'yellow', bold: null, italic: true },
        },
        { insert: 'thrtheough' },
      ]),
    );
  });

  it('a', function () {
    const original = new Delta([
      {
        insert: 'a',
        attributes: { font: 'serif', bold: true, italic: true },
      },
      { insert: 'w' },
      {
        insert: { url: 'http://quilljs.com' },
        attributes: {
          color: 'orange',
          detectionId: '16f19f4b-aeb3-44d6-8987-f272bc061b06',
        },
      },
      {
        insert: { url: 'http://quilljs.com' },
        attributes: { bold: true },
      },
      {
        insert: 2,
        attributes: { detectionId: '9c4180de-2297-4eca-8553-e0d606a05e50' },
      },
      { insert: 'k', attributes: { color: 'red', italic: true } },
      {
        insert: { image: 'http://quilljs.com' },
        attributes: { font: 'serif', italic: true },
      },
      { insert: 'Tr' },
      { insert: 'est', attributes: { font: 'monospace', bold: true } },
      { insert: 'ehedcame' },
      {
        insert: 'with',
        attributes: { detectionId: 'ea0a9f6a-cae7-497f-bfab-ff3749719b95' },
      },
      { insert: 'as' },
      { insert: 'sh', attributes: { italic: true } },
      { insert: 'h' },
      {
        insert: 'iff',
        attributes: {
          font: 'monospace',
          bold: true,
          italic: true,
          detectionId: '4ca892f7-383f-44a6-a6fc-87846767d526',
        },
      },
      {
        insert: 'l',
        attributes: { detectionId: '1d05b61c-6c19-4280-9967-8d83638fb6d2' },
      },
      {
        insert: 'ng',
        attributes: {
          bold: true,
          detectionId: '50bd9de5-de2e-4c12-9ce8-e5d154c56156',
        },
      },
      { insert: 'm', attributes: { font: 'sans-serif', bold: true } },
      { insert: 'So' },
      {
        insert: { image: 'http://quilljs.com' },
        attributes: { font: 'serif', color: 'orange' },
      },
      { insert: 'y', attributes: { italic: true, color: 'orange' } },
      { insert: 're', attributes: { italic: true } },
      { insert: 'h', attributes: { bold: true } },
      { insert: 2, attributes: { bold: true } },
      { insert: 'houe' },
      { insert: 'e', attributes: { font: 'sans-serif', italic: true } },
      { insert: 'vo', attributes: { font: 'sans-serif', bold: true } },
      { insert: 'rpal', attributes: { font: 'serif' } },
      { insert: 'h', attributes: { color: 'red' } },
      {
        insert: { url: 'http://quilljs.com' },
        attributes: { italic: true },
      },
      { insert: 'a', attributes: { color: 'red' } },
      { insert: 'nthed' },
      {
        insert: 'oo',
        attributes: {
          color: 'purple',
          detectionId: '2dcaf529-e262-431d-bd02-824e252e164b',
        },
      },
      { insert: 'd' },
      { insert: 'to', attributes: { color: 'purple' } },
      { insert: 2, attributes: { color: 'orange', font: 'serif' } },
      {
        insert: { url: 'http://quilljs.com' },
        attributes: { color: 'orange', font: 'serif' },
      },
      { insert: 've', attributes: { color: 'orange', font: 'serif' } },
      { insert: 's', attributes: { color: 'purple' } },
      { insert: 'x', attributes: { color: 'yellow', bold: true } },
      { insert: 't', attributes: { bold: true } },
      { insert: 'snackhrtheough' },
      {
        insert: { image: 'http://quilljs.com' },
        attributes: { color: 'yellow' },
      },
      { insert: 'g' },
      {
        insert: 'to',
        attributes: {
          color: 'yellow',
          font: 'monospace',
          bold: true,
          detectionId: 'aa4f15f3-27a7-4ed5-8634-459f8442c1e0',
        },
      },
      {
        insert: { image: 'http://quilljs.com' },
        attributes: { color: 'red' },
      },
      { insert: 'imble' },
      { insert: 'e', attributes: { italic: true } },
      { insert: 'as' },
      {
        insert: { image: 'http://quilljs.com' },
        attributes: { color: 'red', bold: true },
      },
      {
        insert: 'Cal',
        attributes: {
          bold: true,
          detectionId: '0119fa75-1136-4023-8ac3-69e932839181',
        },
      },
      { insert: 'looh' },
    ]);

    const serverComposed = new Delta([
      { retain: 3 },
      {
        attributes: {
          font: 'monospace',
          bold: true,
          detectionId: '2c6811ab-46f5-4672-84ec-bc3a9bd9a74d',
        },
        insert: { image: 'http://quilljs.com' },
      },
      {
        attributes: {
          color: 'purple',
          detectionId: '8b2585d4-bbd7-4de8-a18c-23fdd915c00f',
        },
        insert: 'mome',
      },
      {
        retain: 1,
        attributes: {
          bold: null,
          italic: true,
          detectionId: '21b9c1e8-d8f9-43ea-8f91-c3890e25a2aa',
        },
      },
      { delete: 1 },
      {
        retain: 1,
        attributes: {
          bold: null,
          italic: true,
          detectionId: '21b9c1e8-d8f9-43ea-8f91-c3890e25a2aa',
        },
      },
      { delete: 6 },
      { retain: 1, attributes: { detectionId: null } },
      { retain: 3 },
      { insert: { image: 'http://quilljs.com' } },
      { retain: 1 },
      { delete: 3 },
      { retain: 4 },
      { delete: 3 },
    ]);

    const clientComposed = new Delta([
      { retain: 5 },
      {
        retain: 4,
        attributes: { detectionId: '6df775a6-b82c-4cc3-ba7c-7740679f0e97' },
      },
    ]);

    const [server_, client_] = transformX(serverComposed, clientComposed);

    expect(original.compose(serverComposed).compose(client_)).toEqual(
      original.compose(clientComposed).compose(server_),
    );
  });
});
