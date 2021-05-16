var Delta = require('../../dist/Delta');

/**
 * NOTE: Assumes compose() works as intended...
 * - when adding a new detection, it "removed" any overlapping detections first
 * - gets rid of any partially deleted detectionIds (either through "null" or "delete")
 * - get rid of any detections that have been split by an insert
 */

describe('validated detections', function () {
  describe('insert inside of detection retain', function () {
    var a = new Delta().retain(1).insert('X');
    var b = new Delta().retain(2, { detectionId: '123' });
    // var expectedA = new Delta().retain(1, { detectionId: '123' }).retain(1); // original
    // var expectedA = new Delta().retain(1, { detectionId: null }).retain(1); // modified
    // var expectedA = new Delta().retain(2); // nulls are not needed for transforms
    var expectedA = new Delta(); // chop
    // var expectedB = new Delta().retain(1).insert('A'); // original
    // var expectedB = new Delta().retain(1, { detectionId: null }).insert('A').retain(1, { detectionId: null }); // modified
    // var expectedB = new Delta().retain(1).insert('A').retain(1); // nulls are not needed for transforms
    var expectedB = new Delta().retain(1).insert('X'); // chop

    it('transforms', function () {
      expect(a.transform(b, true)).toEqual(expectedA);
      expect(b.transform(a, true)).toEqual(expectedB);
      expect(a.transform(b, false)).toEqual(expectedA);
      expect(b.transform(a, false)).toEqual(expectedB);
    });

    it('compose + transform', function () {
      const doc = new Delta().insert('ABC');
      const final = new Delta().insert('AXBC');
      expect(doc.compose(a).compose(expectedA, true)).toEqual(final);
      expect(doc.compose(b).compose(expectedB, false)).toEqual(final);
      expect(doc.compose(a).compose(expectedA, false)).toEqual(final);
      expect(doc.compose(b).compose(expectedB, true)).toEqual(final);
    });
  });

  describe('det insert & delete [not modified]', function () {
    var a = new Delta().insert('X', { detectionId: '123' });
    var b = new Delta().delete(1);
    var expectedA = new Delta().retain(1).delete(1);
    var expectedB = new Delta().insert('X', { detectionId: '123' });

    it('transforms', function () {
      expect(a.transform(b, true)).toEqual(expectedA);
      expect(b.transform(a, true)).toEqual(expectedB);
      expect(a.transform(b, false)).toEqual(expectedA);
      expect(b.transform(a, false)).toEqual(expectedB);
    });

    it('compose + transform', function () {
      const doc = new Delta().insert('ABC', { detectionId: '234' });
      const final = new Delta()
        .insert('X', { detectionId: '123' })
        .insert('BC');
      expect(doc.compose(a).compose(expectedA, true)).toEqual(final);
      expect(doc.compose(b).compose(expectedB, false)).toEqual(final);
      expect(doc.compose(a).compose(expectedA, false)).toEqual(final);
      expect(doc.compose(b).compose(expectedB, true)).toEqual(final);
    });
  });

  describe('det retain & delete', function () {
    var a = new Delta().retain(2, { detectionId: '123' });
    var b = new Delta().delete(1);
    var expectedA = new Delta().delete(1); // same as original
    // var expected2 = new Delta().retain(2, { detectionId: '123' }); // original
    // var expected2 = new Delta().retain(2); // modified
    var expectedB = new Delta(); // chop

    it('transforms', function () {
      expect(a.transform(b, true)).toEqual(expectedA);
      expect(b.transform(a, true)).toEqual(expectedB);
      expect(a.transform(b, false)).toEqual(expectedA);
      expect(b.transform(a, false)).toEqual(expectedB);
    });

    it('compose + transform', function () {
      const doc = new Delta().insert('ABC');
      const final = new Delta().insert('BC');
      expect(doc.compose(a).compose(expectedA, true)).toEqual(final);
      expect(doc.compose(b).compose(expectedB, false)).toEqual(final);
      expect(doc.compose(a).compose(expectedA, false)).toEqual(final);
      expect(doc.compose(b).compose(expectedB, true)).toEqual(final);
    });
  });

  describe('detection retain & detection retain (always ignore one of them)', function () {
    var a = new Delta().retain(2).retain(2, { detectionId: '123' });
    var b = new Delta().retain(3, { detectionId: '234' });

    // var expectedAPriority = new Delta().retain(2, { detectionId: '234' }); // original
    // var expectedAPriority = new Delta().retain(2); // modified
    var expectedAPriority = new Delta(); // chop
    // var expectedBPriority = new Delta().retain(3).retain(1, { detectionId: '123' }); // original
    // var expectedBPriority = new Delta().retain(3).retain(1); // modified
    var expectedBPriority = new Delta(); // chop

    // without priority - same as original
    var expectedAWithout = new Delta().retain(3, { detectionId: '234' });
    var expectedBWithout = new Delta()
      .retain(2)
      .retain(2, { detectionId: '123' });

    it('transforms with priority', function () {
      expect(a.transform(b, true)).toEqual(expectedAPriority);
      expect(b.transform(a, true)).toEqual(expectedBPriority);
    });

    it('transforms without priority', function () {
      expect(a.transform(b, false)).toEqual(expectedAWithout);
      expect(b.transform(a, false)).toEqual(expectedBWithout);
    });

    it('compose + transform with A priority', function () {
      const doc = new Delta().insert('ABCD');
      const final = new Delta()
        .insert('AB')
        .insert('CD', { detectionId: '123' });
      expect(doc.compose(a).compose(expectedAPriority)).toEqual(final);
      expect(doc.compose(b).compose(expectedBWithout)).toEqual(final);
    });

    it('compose + transform with B Priority', function () {
      const doc = new Delta().insert('ABCD');
      const final = new Delta()
        .insert('ABC', { detectionId: '234' })
        .insert('D');
      expect(doc.compose(a).compose(expectedAWithout)).toEqual(final);
      expect(doc.compose(b).compose(expectedBPriority)).toEqual(final);
    });
  });

  describe('detection null + retain detection', function () {
    var a = new Delta().retain(3, { detectionId: null });
    var b = new Delta().retain(1).retain(4, { detectionId: '123' });

    // var expectedAPriority = new Delta().retain(3).retain(2, { detectionId: '123' }); // original
    // var expectedAPriority = new Delta().retain(5); // modified without chop
    var expectedAPriority = new Delta();
    var expectedBPriority = new Delta().retain(1, { detectionId: null }); // same as original

    var expectedAWithout = new Delta()
      .retain(1)
      .retain(4, { detectionId: '123' });
    var expectedBWithout = new Delta().retain(3, {
      detectionId: null,
    });

    it('transforms with priority', function () {
      expect(a.transform(b, true)).toEqual(expectedAPriority);
      expect(b.transform(a, true)).toEqual(expectedBPriority);
    });

    it('transforms without priority', function () {
      expect(a.transform(b, false)).toEqual(expectedAWithout);
      expect(b.transform(a, false)).toEqual(expectedBWithout);
    });

    it('compose + transform with A priority', function () {
      const doc = new Delta()
        .insert('ABC', { detectionId: '234' })
        .insert('DE');
      const final = new Delta().insert('ABCDE');
      expect(doc.compose(a).compose(expectedAPriority)).toEqual(final);
      expect(doc.compose(b).compose(expectedBWithout)).toEqual(final);
    });

    it('compose + transform with B Priority', function () {
      const doc = new Delta()
        .insert('ABC', { detectionId: '234' })
        .insert('DE');
      const final = new Delta()
        .insert('A')
        .insert('BCDE', { detectionId: '123' });
      expect(doc.compose(a).compose(expectedAWithout)).toEqual(final);
      expect(doc.compose(b).compose(expectedBPriority)).toEqual(final);
    });
  });

  describe('detection null + delete [not modified]', function () {
    var a = new Delta().retain(3, { detectionId: null });
    var b = new Delta().delete(1);

    var expectedA = new Delta().delete(1);
    var expectedB = new Delta().retain(2, { detectionId: null });

    it('transforms', function () {
      expect(a.transform(b, true)).toEqual(expectedA);
      expect(b.transform(a, true)).toEqual(expectedB);
      expect(a.transform(b, false)).toEqual(expectedA);
      expect(b.transform(a, false)).toEqual(expectedB);
    });

    it('compose + transform', function () {
      const doc = new Delta().insert('ABC', { detectionId: '123' });
      const final = new Delta().insert('BC');
      expect(doc.compose(a).compose(expectedA, true)).toEqual(final);
      expect(doc.compose(b).compose(expectedB, false)).toEqual(final);
      expect(doc.compose(a).compose(expectedA, false)).toEqual(final);
      expect(doc.compose(b).compose(expectedB, true)).toEqual(final);
    });
  });

  describe('detection null + insert [not modified]', function () {
    var a = new Delta().retain(3, { detectionId: null });
    var b = new Delta().insert('X');

    var expectedA = new Delta().insert('X');
    var expectedB = new Delta().retain(1).retain(3, { detectionId: null });

    it('transforms', function () {
      expect(a.transform(b, true)).toEqual(expectedA);
      expect(b.transform(a, true)).toEqual(expectedB);
      expect(a.transform(b, false)).toEqual(expectedA);
      expect(b.transform(a, false)).toEqual(expectedB);
    });

    it('compose + transform', function () {
      const doc = new Delta().insert('ABC', { detectionId: '123' });
      const final = new Delta().insert('XABC');
      expect(doc.compose(a).compose(expectedA, true)).toEqual(final);
      expect(doc.compose(b).compose(expectedB, false)).toEqual(final);
      expect(doc.compose(a).compose(expectedA, false)).toEqual(final);
      expect(doc.compose(b).compose(expectedB, true)).toEqual(final);
    });
  });
});
