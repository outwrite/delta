var Delta = require('../../dist/Delta');

/**
 * NOTE: Assumes compose() works as intended...
 * - when adding a new detection, it "removed" any overlapping detections first
 * - gets rid of any partially deleted detectionIds (either through "null" or "delete")
 * - get rid of any detections that have been split by an insert
 */

describe('validated detections', function () {
  it('insert inside of detection retain', function () {
    var a1 = new Delta().retain(1).insert('A');
    var b1 = new Delta().retain(2, { detectionId: '123' });
    var a2 = new Delta().retain(2, { detectionId: '123' });
    var b2 = new Delta().retain(1).insert('A');
    // var expected1 = new Delta().retain(1, { detectionId: '123' }).retain(1); // original
    // var expected1 = new Delta().retain(1, { detectionId: null }).retain(1); // modified
    // var expected1 = new Delta().retain(2); // nulls are not needed for transforms
    var expected1 = new Delta(); // chop
    // var expected2 = new Delta().retain(1).insert('A'); // original
    // var expected2 = new Delta().retain(1, { detectionId: null }).insert('A').retain(1, { detectionId: null }); // modified
    // var expected2 = new Delta().retain(1).insert('A').retain(1); // nulls are not needed for transforms
    var expected2 = new Delta().retain(1).insert('A'); // chop
    expect(a1.transform(b1, true)).toEqual(expected1);
    expect(a2.transform(b2, true)).toEqual(expected2);

    const doc1 = new Delta().insert('ABC');
    const doc2 = new Delta().insert('ABC');
    expect(doc1.compose(a1).compose(a1.transform(b1, true))).toEqual(
      doc2.compose(a2).compose(a2.transform(b2, false)),
    );
  });

  it('det insert & delete [not modified]', function () {
    var a1 = new Delta().insert('X', { detectionId: '123' });
    var b1 = new Delta().delete(1);
    var a2 = new Delta().delete(1);
    var b2 = new Delta().insert('X', { detectionId: '123' });
    var expected1 = new Delta().retain(1).delete(1);
    var expected2 = new Delta().insert('X', { detectionId: '123' });
    expect(a1.transform(b1, true)).toEqual(expected1);
    expect(a2.transform(b2, true)).toEqual(expected2);

    const doc1 = new Delta().insert('ABC', { detectionId: '234' });
    const doc2 = new Delta().insert('ABC', { detectionId: '234' });
    const final = new Delta().insert('X', { detectionId: '123' }).insert('BC');
    expect(doc1.compose(a1).compose(a1.transform(b1, true))).toEqual(final);
    expect(doc2.compose(a2).compose(a2.transform(b2, false))).toEqual(final);
  });

  it('det retain & delete', function () {
    var a1 = new Delta().retain(2, { detectionId: '123' });
    var b1 = new Delta().delete(1);
    var a2 = new Delta().retain(2, { detectionId: '123' });
    var b2 = new Delta().delete(1);
    var expected1 = new Delta().delete(1); // same as original
    // var expected2 = new Delta().retain(2, { detectionId: '123' }); // original
    // var expected2 = new Delta().retain(2); // modified
    var expected2 = new Delta(); // chop
    expect(a1.transform(b1, true)).toEqual(expected1);
    expect(b2.transform(a2, true)).toEqual(expected2);
  });

  it('detection retain & detection retain (always ignore one of them)', function () {
    // With priority
    var a1 = new Delta().retain(2).retain(2, { detectionId: '123' });
    var b1 = new Delta().retain(3, { detectionId: '234' });
    var a2 = new Delta().retain(2).retain(2, { detectionId: '123' });
    var b2 = new Delta().retain(3, { detectionId: '234' });
    // var expected1 = new Delta().retain(2, { detectionId: '234' }); // original
    // var expected1 = new Delta().retain(2); // modified
    var expected1 = new Delta(); // chop
    // var expected2 = new Delta().retain(3).retain(1, { detectionId: '123' }); // original
    // var expected2 = new Delta().retain(3).retain(1); // modified
    var expected2 = new Delta(); // chop
    expect(a1.transform(b1, true)).toEqual(expected1);
    expect(b2.transform(a2, true)).toEqual(expected2);

    // Without priority - same as original... (composition should do the work of merging)
    var a3 = new Delta().retain(2).retain(2, { detectionId: '123' });
    var b3 = new Delta().retain(3, { detectionId: '234' });
    var a4 = new Delta().retain(2).retain(2, { detectionId: '123' });
    var b4 = new Delta().retain(3, { detectionId: '234' });
    var expected3 = new Delta().retain(3, { detectionId: '234' }); // original
    var expected4 = new Delta().retain(2).retain(2, { detectionId: '234' }); // original
    expect(a3.transform(b3, false)).toEqual(expected3);
    expect(b4.transform(a4, false)).toEqual(expected4);

    const doc1 = new Delta().insert('ABCD');
    const doc2 = new Delta().insert('ABCD');
    const final1 = new Delta()
      .insert('AB')
      .insert('CD', { detectionId: '123' });
    expect(doc1.compose(a1).compose(a1.transform(b1, true))).toEqual(final1);
    expect(doc2.compose(b2).compose(b2.transform(a2, false))).toEqual(final1);

    const doc3 = new Delta().insert('ABCD');
    const doc4 = new Delta().insert('ABCD');
    const final2 = new Delta()
      .insert('A')
      .insert('BCD', { detectionId: '234' });
    expect(doc3.compose(a3).compose(a3.transform(b3, false))).toEqual(final2);
    expect(doc4.compose(b4).compose(b4.transform(a4, true))).toEqual(final2);
  });

  it('detection null + retain detection', function () {
    var a = new Delta().retain(3, { detectionId: null });
    var b = new Delta().retain(1).retain(4, { detectionId: '123' });

    // a1 with priority
    // original - new Delta().retain(3).retain(2, { detectionId: '123' }); // original
    // modified - new Delta().retain(5); // modified without chop
    expect(a.transform(b, true)).toEqual(new Delta());
    expect(b.transform(a, false)).toEqual(
      new Delta().retain(3, { detectionId: null }), // same as original
    );

    // a1 without priority - same as original
    expect(a.transform(b, false)).toEqual(
      new Delta().retain(1).retain(4, { detectionId: '123' }),
      // we could also go:
      // new Delta().retain(1, { detectionId: null }).retain(4, { detectionId: '123' })
      // but if compose() is working as intended, we should need to do this
    );
    expect(b.transform(a, true)).toEqual(
      new Delta().retain(1, { detectionId: null }), // same as original
    );

    const doc = new Delta().insert('ABC', { detectionId: '234' }).insert('DE');
    const finalWithAPriority = new Delta().insert('ABCDE');
    expect(doc.compose(a).compose(a.transform(b, true))).toEqual(
      finalWithAPriority,
    );
    expect(doc.compose(b).compose(b.transform(a, false))).toEqual(
      finalWithAPriority,
    );

    const finalWithBPriority = new Delta()
      .insert('A')
      .insert('BCDE', { detectionId: '123' });
    expect(doc.compose(a).compose(a.transform(b, false))).toEqual(
      finalWithBPriority,
    );
    expect(doc.compose(b).compose(b.transform(a, true))).toEqual(
      finalWithBPriority,
    );
  });

  it('detection null + delete [not modified]', function () {
    var a = new Delta().retain(3, { detectionId: null });
    var b = new Delta().delete(1);
    expect(a.transform(b, true)).toEqual(new Delta().delete(1));
    expect(b.transform(a, true)).toEqual(
      new Delta().retain(2, { detectionId: null }),
    );

    const doc = new Delta().insert('ABC', { detectionId: '123' });
    const final = new Delta().insert('BC');
    expect(doc.compose(a).compose(a.transform(b, true))).toEqual(final);
    expect(doc.compose(a).compose(a.transform(b, false))).toEqual(final);
    expect(doc.compose(b).compose(b.transform(a, true))).toEqual(final);
    expect(doc.compose(b).compose(b.transform(a, false))).toEqual(final);
  });

  it('detection null + insert [not modified]', function () {
    var a = new Delta().retain(3, { detectionId: null });
    var b = new Delta().insert('X');
    expect(a.transform(b, true)).toEqual(new Delta().insert('X'));
    expect(b.transform(a, true)).toEqual(
      new Delta().retain(1).retain(3, { detectionId: null }),
    );

    const doc = new Delta().insert('ABC', { detectionId: '123' });
    const final = new Delta().insert('XABC');
    expect(doc.compose(a).compose(a.transform(b, true))).toEqual(final);
    expect(doc.compose(a).compose(a.transform(b, false))).toEqual(final);
    expect(doc.compose(b).compose(b.transform(a, true))).toEqual(final);
    expect(doc.compose(b).compose(b.transform(a, false))).toEqual(final);
  });
});
