const Delta = require('../../dist/Delta');

describe('compose()', function () {
  it('insert + insert', function () {
    const a = new Delta().insert('A');
    const b = new Delta().insert('B');
    const expected = new Delta().insert('B').insert('A');
    expect(a.compose(b)).toEqual(expected);
  });

  it('insert + insert (detectionId)', function () {
    const a = new Delta().insert('A', { detectionId: '123' });
    const b = new Delta().insert('B', { detectionId: '234' });
    const expected = new Delta()
      .insert('B', { detectionId: '234' })
      .insert('A', { detectionId: '123' });
    expect(a.compose(b)).toEqual(expected);
  });

  it('insert + retain', function () {
    const a = new Delta().insert('A');
    const b = new Delta().retain(1, { bold: true, color: 'red', font: null });
    const expected = new Delta().insert('A', { bold: true, color: 'red' });
    expect(a.compose(b)).toEqual(expected);
  });

  it('insert + retain (detectionId)', function () {
    const a = new Delta().insert('A');
    const b = new Delta().retain(1, {
      bold: true,
      color: 'red',
      font: null,
      detectionId: '123',
    });
    const expected = new Delta().insert('A', {
      bold: true,
      color: 'red',
      detectionId: '123',
    });
    expect(a.compose(b)).toEqual(expected);
  });

  it('insert + delete', function () {
    const a = new Delta().insert('A');
    const b = new Delta().delete(1);
    const expected = new Delta();
    expect(a.compose(b)).toEqual(expected);
  });

  it('insert + delete (detectionId)', function () {
    const a = new Delta().insert('A', { detectionId: '123' });
    const b = new Delta().delete(1);
    const expected = new Delta();
    expect(a.compose(b)).toEqual(expected);
  });

  it('insert + delete (detectionId) - clears detection', function () {
    const a = new Delta().insert('AB', { detectionId: '123' });
    const b = new Delta().delete(1);
    const expected = new Delta().insert('B');
    expect(a.compose(b)).toEqual(expected);
  });

  it('delete + insert', function () {
    const a = new Delta().delete(1);
    const b = new Delta().insert('B');
    const expected = new Delta().insert('B').delete(1);
    expect(a.compose(b)).toEqual(expected);
  });

  it('delete + insert (detectionId)', function () {
    const a = new Delta().delete(1);
    const b = new Delta().insert('B', { detectionId: '123' });
    const expected = new Delta().insert('B', { detectionId: '123' }).delete(1);
    expect(a.compose(b)).toEqual(expected);
  });

  it('delete + retain', function () {
    const a = new Delta().delete(1);
    const b = new Delta().retain(1, { bold: true, color: 'red' });
    const expected = new Delta()
      .delete(1)
      .retain(1, { bold: true, color: 'red' });
    expect(a.compose(b)).toEqual(expected);
  });

  it('delete + retain (detectionId)', function () {
    const a = new Delta().delete(1);
    const b = new Delta().retain(1, {
      bold: true,
      color: 'red',
      detectionId: '123',
    });
    const expected = new Delta()
      .delete(1)
      .retain(1, { bold: true, color: 'red', detectionId: '123' });
    expect(a.compose(b)).toEqual(expected);
  });

  it('delete + delete', function () {
    const a = new Delta().delete(1);
    const b = new Delta().delete(1);
    const expected = new Delta().delete(2);
    expect(a.compose(b)).toEqual(expected);
  });

  it('retain + insert', function () {
    const a = new Delta().retain(1, { color: 'blue' });
    const b = new Delta().insert('B');
    const expected = new Delta().insert('B').retain(1, { color: 'blue' });
    expect(a.compose(b)).toEqual(expected);
  });

  it('retain + insert (detectionId)', function () {
    const a = new Delta().retain(1, { color: 'blue', detectionId: '123' });
    const b = new Delta().insert('B');
    const expected = new Delta()
      .insert('B')
      .retain(1, { color: 'blue', detectionId: '123' });
    expect(a.compose(b)).toEqual(expected);
  });

  it('retain + retain', function () {
    const a = new Delta().retain(1, { color: 'blue' });
    const b = new Delta().retain(1, { bold: true, color: 'red', font: null });
    const expected = new Delta().retain(1, {
      bold: true,
      color: 'red',
      font: null,
    });
    expect(a.compose(b)).toEqual(expected);
  });

  it('retain + retain (detectionId)', function () {
    const a = new Delta().retain(1, { color: 'blue', detectionId: '123' });
    const b = new Delta().retain(1, {
      bold: true,
      color: 'red',
      font: null,
      detectionId: '234',
    });
    const expected = new Delta().retain(1, {
      bold: true,
      color: 'red',
      font: null,
      detectionId: '234',
    });
    expect(a.compose(b)).toEqual(expected);
  });

  it('retain + delete', function () {
    const a = new Delta().retain(1, { color: 'blue' });
    const b = new Delta().delete(1);
    const expected = new Delta().delete(1);
    expect(a.compose(b)).toEqual(expected);
  });

  it('retain + delete (detectionId)', function () {
    const a = new Delta().retain(1, { color: 'blue', detectionId: '123' });
    const b = new Delta().delete(1);
    const expected = new Delta().delete(1);
    expect(a.compose(b)).toEqual(expected);
  });

  it('retain + delete (detectionId) - clears detection', function () {
    const a = new Delta().retain(2, { color: 'blue', detectionId: '123' });
    const b = new Delta().delete(1);
    const expected = new Delta()
      .delete(1)
      .retain(1, { color: 'blue', detectionId: null });
    expect(a.compose(b)).toEqual(expected);
  });

  it('insert in middle of text', function () {
    const a = new Delta().insert('Hello');
    const b = new Delta().retain(3).insert('X');
    const expected = new Delta().insert('HelXlo');
    expect(a.compose(b)).toEqual(expected);
  });

  it('insert in middle of detection (clears detection)', function () {
    const a = new Delta().insert('Hello', { detectionId: '123' });
    const b = new Delta().retain(3).insert('X');
    const expected = new Delta().insert('HelXlo');
    expect(a.compose(b)).toEqual(expected);
  });

  it('delete in middle of detection (clears detection)', function () {
    const a = new Delta().insert('Hello', { detectionId: '123' });
    const b = new Delta().retain(3).delete(1);
    const expected = new Delta().insert('Helo');
    expect(a.compose(b)).toEqual(expected);
  });

  it('insert and delete ordering', function () {
    const a = new Delta().insert('Hello');
    const b = new Delta().insert('Hello');
    const insertFirst = new Delta().retain(3).insert('X').delete(1);
    const deleteFirst = new Delta().retain(3).delete(1).insert('X');
    const expected = new Delta().insert('HelXo');
    expect(a.compose(insertFirst)).toEqual(expected);
    expect(b.compose(deleteFirst)).toEqual(expected);
  });

  it('insert and delete ordering with detection (clears detection)', function () {
    const a = new Delta().insert('Hello', { detectionId: '123' });
    const b = new Delta().insert('Hello', { detectionId: '123' });
    const insertFirst = new Delta().retain(3).insert('X').delete(1);
    const deleteFirst = new Delta().retain(3).delete(1).insert('X');
    const expected = new Delta().insert('HelXo');
    expect(a.compose(insertFirst)).toEqual(expected);
    expect(b.compose(deleteFirst)).toEqual(expected);
  });

  it('insert embed', function () {
    const a = new Delta().insert(1, { src: 'http://quilljs.com/image.png' });
    const b = new Delta().retain(1, { alt: 'logo' });
    const expected = new Delta().insert(1, {
      src: 'http://quilljs.com/image.png',
      alt: 'logo',
    });
    expect(a.compose(b)).toEqual(expected);
  });

  it('delete entire text', function () {
    const a = new Delta().retain(4).insert('Hello');
    const b = new Delta().delete(9);
    const expected = new Delta().delete(4);
    expect(a.compose(b)).toEqual(expected);
  });

  it('delete entire text (detectionId)', function () {
    const a = new Delta().retain(4).insert('Hello', { detectionId: '123' });
    const b = new Delta().delete(9);
    const expected = new Delta().delete(4);
    expect(a.compose(b)).toEqual(expected);
  });

  it('retain more than length of text', function () {
    const a = new Delta().insert('Hello');
    const b = new Delta().retain(10);
    const expected = new Delta().insert('Hello');
    expect(a.compose(b)).toEqual(expected);
  });

  it('retain empty embed', function () {
    const a = new Delta().insert(1);
    const b = new Delta().retain(1);
    const expected = new Delta().insert(1);
    expect(a.compose(b)).toEqual(expected);
  });

  it('remove all attributes', function () {
    const a = new Delta().insert('A', { bold: true });
    const b = new Delta().retain(1, { bold: null });
    const expected = new Delta().insert('A');
    expect(a.compose(b)).toEqual(expected);
  });

  it('remove all attributes (detectionId)', function () {
    const a = new Delta().insert('A', { detectionId: '123' });
    const b = new Delta().retain(1, { detectionId: null });
    const expected = new Delta().insert('A');
    expect(a.compose(b)).toEqual(expected);
  });

  it('remove all embed attributes', function () {
    const a = new Delta().insert(2, { bold: true });
    const b = new Delta().retain(1, { bold: null });
    const expected = new Delta().insert(2);
    expect(a.compose(b)).toEqual(expected);
  });

  it('remove all detection attributes (like embeds)', function () {
    const a = new Delta().insert('AB', { detectionId: '123' });
    const b = new Delta().retain(1, { detectionId: null });
    const expected = new Delta().insert('AB');
    expect(a.compose(b)).toEqual(expected);
  });

  it('remove all detection attributes (like embeds) 2', function () {
    const a = new Delta()
      .insert(
        { url: 'http://quilljs.com' },
        {
          italic: true,
          detectionId: '21b9c1e8-d8f9-43ea-8f91-c3890e25a2aa',
        },
      )
      .insert('k', {
        italic: true,
        detectionId: '21b9c1e8-d8f9-43ea-8f91-c3890e25a2aa',
        color: 'red',
      });
    const b = new Delta().retain(1).retain(1, { detectionId: null });
    const expected = new Delta()
      .insert({ url: 'http://quilljs.com' }, { italic: true })
      .insert('k', {
        italic: true,
        color: 'red',
      });
    expect(a.compose(b)).toEqual(expected);
  });

  it('replace detectionId (clear detection)', function () {
    const a = new Delta().insert('AB', { detectionId: '123' });
    const b = new Delta().retain(1, { detectionId: '234' });
    const expected = new Delta()
      .insert('A', { detectionId: '234' })
      .insert('B');
    expect(a.compose(b)).toEqual(expected);
  });

  it('replace detectionId (clear detection) 2', function () {
    const a = new Delta().insert('AB').insert('CD', { detectionId: '123' });
    const b = new Delta().retain(1).retain(3, { detectionId: '234' });
    const expected = new Delta()
      .insert('A')
      .insert('BCD', { detectionId: '234' });
    expect(a.compose(b)).toEqual(expected);
  });

  it('immutability', function () {
    const attr1 = { bold: true };
    const attr2 = { bold: true };
    const a1 = new Delta().insert('Test', attr1);
    const a2 = new Delta().insert('Test', attr1);
    const b1 = new Delta().retain(1, { color: 'red' }).delete(2);
    const b2 = new Delta().retain(1, { color: 'red' }).delete(2);
    const expected = new Delta()
      .insert('T', { color: 'red', bold: true })
      .insert('t', attr1);
    expect(a1.compose(b1)).toEqual(expected);
    expect(a1).toEqual(a2);
    expect(b1).toEqual(b2);
    expect(attr1).toEqual(attr2);
  });

  it('retain start optimization', function () {
    const a = new Delta()
      .insert('A', { bold: true })
      .insert('B')
      .insert('C', { bold: true })
      .delete(1);
    const b = new Delta().retain(3).insert('D');
    const expected = new Delta()
      .insert('A', { bold: true })
      .insert('B')
      .insert('C', { bold: true })
      .insert('D')
      .delete(1);
    expect(a.compose(b)).toEqual(expected);
  });

  it('retain start optimization split', function () {
    const a = new Delta()
      .insert('A', { bold: true })
      .insert('B')
      .insert('C', { bold: true })
      .retain(5)
      .delete(1);
    const b = new Delta().retain(4).insert('D');
    const expected = new Delta()
      .insert('A', { bold: true })
      .insert('B')
      .insert('C', { bold: true })
      .retain(1)
      .insert('D')
      .retain(4)
      .delete(1);
    expect(a.compose(b)).toEqual(expected);
  });

  it('retain end optimization', function () {
    const a = new Delta()
      .insert('A', { bold: true })
      .insert('B')
      .insert('C', { bold: true });
    const b = new Delta().delete(1);
    const expected = new Delta().insert('B').insert('C', { bold: true });
    expect(a.compose(b)).toEqual(expected);
  });

  it('retain end optimization join', function () {
    const a = new Delta()
      .insert('A', { bold: true })
      .insert('B')
      .insert('C', { bold: true })
      .insert('D')
      .insert('E', { bold: true })
      .insert('F');
    const b = new Delta().retain(1).delete(1);
    const expected = new Delta()
      .insert('AC', { bold: true })
      .insert('D')
      .insert('E', { bold: true })
      .insert('F');
    expect(a.compose(b)).toEqual(expected);
  });

  it('a', function () {
    const list = [
      new Delta([
        {
          insert: 'outgrabe',
          attributes: { color: 'purple', detectionId: '0' },
        },
      ]),
      new Delta([
        { retain: 1 },
        { insert: 'blade' },
        { retain: 5 },
        {
          retain: 2,
          attributes: { bold: true, italic: null, detectionId: '1' },
        },
      ]),
      new Delta([{ retain: 3 }, { delete: 4 }]),
      new Delta([
        { retain: 4 },
        {
          insert: { url: 'http://quilljs.com' },
          attributes: { font: 'serif', italic: true, detectionId: '2' },
        },
        { retain: 1 },
        { delete: 1 },
        { retain: 3 },
      ]),
      new Delta([
        { retain: 1, attributes: { color: 'orange', detectionId: null } },
      ]),
      new Delta([{ retain: 3 }, { insert: 'in' }]),
    ];

    const expected = [
      new Delta([]),
      new Delta([
        {
          insert: 'outgrabe',
          attributes: { color: 'purple', detectionId: '0' },
        },
      ]),
      new Delta([
        { insert: 'o', attributes: { color: 'purple' } },
        { insert: 'blade' },
        { insert: 'utgra', attributes: { color: 'purple' } },
        {
          insert: 'be',
          attributes: { bold: true, color: 'purple', detectionId: '1' },
        },
      ]),
      new Delta([
        { insert: 'o', attributes: { color: 'purple' } },
        { insert: 'bl' },
        { insert: 'tgra', attributes: { color: 'purple' } },
        {
          insert: 'be',
          attributes: { bold: true, color: 'purple', detectionId: '1' },
        },
      ]),
      new Delta([
        { insert: 'o', attributes: { color: 'purple' } },
        { insert: 'bl' },
        { insert: 't', attributes: { color: 'purple' } },
        {
          insert: { url: 'http://quilljs.com' },
          attributes: { font: 'serif', italic: true, detectionId: '2' },
        },
        { insert: 'ga', attributes: { color: 'purple' } },
        {
          insert: 'be',
          attributes: { bold: true, color: 'purple', detectionId: '1' },
        },
      ]),
      new Delta([
        { insert: 'o', attributes: { color: 'orange' } },
        { insert: 'bl' },
        { insert: 't', attributes: { color: 'purple' } },
        {
          insert: { url: 'http://quilljs.com' },
          attributes: { font: 'serif', italic: true, detectionId: '2' },
        },
        { insert: 'ga', attributes: { color: 'purple' } },
        {
          insert: 'be',
          attributes: { bold: true, color: 'purple', detectionId: '1' },
        },
      ]),
      new Delta([
        { insert: 'o', attributes: { color: 'orange' } },
        { insert: 'blin' },
        { insert: 't', attributes: { color: 'purple' } },
        {
          insert: { url: 'http://quilljs.com' },
          attributes: { font: 'serif', italic: true, detectionId: '2' },
        },
        { insert: 'ga', attributes: { color: 'purple' } },
        {
          insert: 'be',
          attributes: { bold: true, color: 'purple', detectionId: '1' },
        },
      ]),
    ];

    for (let i = 0; i < expected.length - 1; i++) {
      const initialDoc = expected[i];
      const op = list[i];
      const expectedDoc = expected[i + 1];
      expect(initialDoc.compose(op)).toEqual(expectedDoc);
    }
  });

  it('inserts take precedence over deletes if there are at the same index', () => {
    const thisOp = new Delta([
      { retain: 2, attributes: { color: 'purple', font: null } },
      {
        retain: 1,
        attributes: { font: 'serif', detectionId: null, color: 'purple' },
      },
      { retain: 1, attributes: { color: 'purple', font: null } },
      { delete: 1 },
      { retain: 1 },
      {
        retain: 2,
        attributes: { color: 'purple', font: 'serif', italic: null },
      },
      { insert: 'his' },
      { retain: 1 },
      {
        attributes: { detectionId: 'c2e6a141-8092-4e65-97ed-3bef0d5eced2' },
        insert: 'took',
      },
      {
        attributes: {
          color: 'purple',
          detectionId: '4dd308e1-e022-4806-b071-8152976018c4',
        },
        insert: 'that',
      },
    ]);
    const otherOp = new Delta([
      { retain: 2 },
      { retain: 4, attributes: { bold: null, italic: null } },
      { retain: 2 },
      { delete: 3 },
      { retain: 2 },
      { delete: 4 },
    ]);
    thisOp.compose(otherOp);
  });

  it('b', () => {
    const ops = [
      new Delta([
        { retain: 3 },
        { retain: 3, attributes: { color: 'green', italic: true } },
      ]),
      new Delta([
        { retain: 3 },
        { retain: 4, attributes: { color: 'orange', bold: null } },
      ]),
      new Delta([
        {
          insert: { url: 'http://quilljs.com' },
          attributes: { color: 'yellow', italic: true },
        },
        { retain: 5 },
        { insert: 'the', attributes: { italic: true, detectionId: '7' } },
      ]),
      new Delta([
        { insert: 'it', attributes: { font: 'serif', detectionId: '8' } },
      ]),
      new Delta([
        { retain: 1 },
        {
          insert: { url: 'http://quilljs.com' },
          attributes: { color: 'blue', detectionId: '9' },
        },
      ]),
    ];
    const expected = [
      new Delta([
        { insert: 'm' },
        {
          insert: 'an',
          attributes: {
            italic: true,
            font: 'monospace',
            color: 'yellow',
            detectionId: '6',
          },
        },
        {
          insert: 'x',
          attributes: { italic: true, color: 'yellow', detectionId: '6' },
        },
        { insert: 'thrtheough' },
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
            detectionId: '5',
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
        { insert: 'Cal', attributes: { bold: true } },
        { insert: 'looh' },
      ]),
      new Delta([
        { insert: 'm' },
        {
          insert: 'an',
          attributes: {
            italic: true,
            font: 'monospace',
            color: 'yellow',
            detectionId: '6',
          },
        },
        {
          insert: 'x',
          attributes: { color: 'green', italic: true, detectionId: '6' },
        },
        { insert: 'th', attributes: { color: 'green', italic: true } },
        { insert: 'rtheough' },
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
            detectionId: '5',
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
        { insert: 'Cal', attributes: { bold: true } },
        { insert: 'looh' },
      ]),
      new Delta([
        { insert: 'm' },
        {
          insert: 'an',
          attributes: {
            italic: true,
            font: 'monospace',
            color: 'yellow',
            detectionId: '6',
          },
        },
        {
          insert: 'x',
          attributes: { color: 'orange', italic: true, detectionId: '6' },
        },
        { insert: 'th', attributes: { color: 'orange', italic: true } },
        { insert: 'r', attributes: { color: 'orange' } },
        { insert: 'theough' },
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
            detectionId: '5',
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
        { insert: 'Cal', attributes: { bold: true } },
        { insert: 'looh' },
      ]),
      new Delta([
        {
          insert: { url: 'http://quilljs.com' },
          attributes: { color: 'yellow', italic: true },
        },
        { insert: 'm' },
        {
          insert: 'an',
          attributes: {
            italic: true,
            font: 'monospace',
            color: 'yellow',
            detectionId: '6',
          },
        },
        {
          insert: 'x',
          attributes: { color: 'orange', italic: true, detectionId: '6' },
        },
        { insert: 't', attributes: { color: 'orange', italic: true } },
        { insert: 'the', attributes: { italic: true, detectionId: '7' } },
        { insert: 'h', attributes: { color: 'orange', italic: true } },
        { insert: 'r', attributes: { color: 'orange' } },
        { insert: 'theough' },
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
            detectionId: '5',
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
        { insert: 'Cal', attributes: { bold: true } },
        { insert: 'looh' },
      ]),
      new Delta([
        { insert: 'it', attributes: { font: 'serif', detectionId: '8' } },
        {
          insert: { url: 'http://quilljs.com' },
          attributes: { color: 'yellow', italic: true },
        },
        { insert: 'm' },
        {
          insert: 'an',
          attributes: {
            italic: true,
            font: 'monospace',
            color: 'yellow',
            detectionId: '6',
          },
        },
        {
          insert: 'x',
          attributes: { color: 'orange', italic: true, detectionId: '6' },
        },
        { insert: 't', attributes: { color: 'orange', italic: true } },
        { insert: 'the', attributes: { italic: true, detectionId: '7' } },
        { insert: 'h', attributes: { color: 'orange', italic: true } },
        { insert: 'r', attributes: { color: 'orange' } },
        { insert: 'theough' },
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
            detectionId: '5',
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
        { insert: 'Cal', attributes: { bold: true } },
        { insert: 'looh' },
      ]),
      new Delta([
        { insert: 'i', attributes: { font: 'serif' } },
        {
          insert: { url: 'http://quilljs.com' },
          attributes: { color: 'blue', detectionId: '9' },
        },
        { insert: 't', attributes: { font: 'serif' } },
        {
          insert: { url: 'http://quilljs.com' },
          attributes: { color: 'yellow', italic: true },
        },
        { insert: 'm' },
        {
          insert: 'an',
          attributes: {
            italic: true,
            font: 'monospace',
            color: 'yellow',
            detectionId: '6',
          },
        },
        {
          insert: 'x',
          attributes: { color: 'orange', italic: true, detectionId: '6' },
        },
        { insert: 't', attributes: { color: 'orange', italic: true } },
        { insert: 'the', attributes: { italic: true, detectionId: '7' } },
        { insert: 'h', attributes: { color: 'orange', italic: true } },
        { insert: 'r', attributes: { color: 'orange' } },
        { insert: 'theough' },
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
            detectionId: '5',
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
        { insert: 'Cal', attributes: { bold: true } },
        { insert: 'looh' },
      ]),
    ];
    for (let i = 0; i < expected.length - 1; i++) {
      const initialDoc = expected[i];
      const op = ops[i];
      const expectedDoc = expected[i + 1];
      expect(initialDoc.compose(op)).toEqual(expectedDoc);
    }
  });

  it('c', () => {
    const ops = [
      new Delta([
        { retain: 3 },
        { insert: 'toves', attributes: { color: 'purple' } },
      ]),
      new Delta([
        { retain: 1 },
        {
          insert: 'He',
          attributes: { font: 'sans-serif', italic: true, detectionId: '6' },
        },
      ]),
      new Delta([
        { retain: 3 },
        { retain: 1, attributes: { bold: true, detectionId: '7' } },
      ]),
      new Delta([
        { retain: 1 },
        {
          retain: 1,
          attributes: { color: 'red', font: null, bold: null },
        },
        { retain: 3 },
        { retain: 2, attributes: { bold: null } },
        { insert: 2, attributes: { color: 'purple', font: 'serif' } },
        { insert: { url: 'http://quilljs.com' } },
        { retain: 3 },
        { retain: 2, attributes: { bold: true, italic: null } },
        { insert: 'snack' },
      ]),
      new Delta([{ retain: 5 }, { insert: 'wood' }]),
    ];
    const expected = [
      new Delta([
        { insert: 'm' },
        {
          insert: 'an',
          attributes: {
            italic: true,
            font: 'monospace',
            color: 'yellow',
            detectionId: '6',
          },
        },
        {
          insert: 'x',
          attributes: { italic: true, color: 'yellow', detectionId: '6' },
        },
        { insert: 'thrtheough' },
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
            detectionId: '5',
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
        { insert: 'Cal', attributes: { bold: true } },
        { insert: 'looh' },
      ]),
      new Delta([
        { insert: 'm' },
        {
          insert: 'an',
          attributes: {
            italic: true,
            font: 'monospace',
            color: 'yellow',
          },
        },
        { insert: 'toves', attributes: { color: 'purple' } },
        {
          insert: 'x',
          attributes: { italic: true, color: 'yellow' },
        },
        { insert: 'thrtheough' },
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
            detectionId: '5',
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
        { insert: 'Cal', attributes: { bold: true } },
        { insert: 'looh' },
      ]),
      new Delta([
        { insert: 'm' },
        {
          insert: 'He',
          attributes: { font: 'sans-serif', italic: true, detectionId: '6' },
        },
        {
          insert: 'an',
          attributes: {
            italic: true,
            font: 'monospace',
            color: 'yellow',
          },
        },
        { insert: 'toves', attributes: { color: 'purple' } },
        {
          insert: 'x',
          attributes: { italic: true, color: 'yellow' },
        },
        { insert: 'thrtheough' },
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
            detectionId: '5',
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
        { insert: 'Cal', attributes: { bold: true } },
        { insert: 'looh' },
      ]),
      new Delta([
        { insert: 'm' },
        {
          insert: 'He',
          attributes: { font: 'sans-serif', italic: true, detectionId: '6' },
        },
        {
          insert: 'a',
          attributes: {
            italic: true,
            font: 'monospace',
            color: 'yellow',
            bold: true,
            detectionId: '7',
          },
        },
        {
          insert: 'n',
          attributes: {
            italic: true,
            font: 'monospace',
            color: 'yellow',
          },
        },
        { insert: 'toves', attributes: { color: 'purple' } },
        {
          insert: 'x',
          attributes: { italic: true, color: 'yellow' },
        },
        { insert: 'thrtheough' },
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
            detectionId: '5',
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
        { insert: 'Cal', attributes: { bold: true } },
        { insert: 'looh' },
      ]),
      new Delta([
        { insert: 'm' },
        {
          insert: 'H',
          attributes: { italic: true, detectionId: '6', color: 'red' },
        },
        {
          insert: 'e',
          attributes: { font: 'sans-serif', italic: true, detectionId: '6' },
        },
        {
          insert: 'a',
          attributes: {
            italic: true,
            font: 'monospace',
            color: 'yellow',
            bold: true,
            detectionId: '7',
          },
        },
        {
          insert: 'n',
          attributes: {
            italic: true,
            font: 'monospace',
            color: 'yellow',
          },
        },
        { insert: 'to', attributes: { color: 'purple' } },
        { insert: 2, attributes: { color: 'purple', font: 'serif' } },
        { insert: { url: 'http://quilljs.com' } },
        { insert: 'ves', attributes: { color: 'purple' } },
        {
          insert: 'x',
          attributes: { color: 'yellow', bold: true },
        },
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
            detectionId: '5',
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
        { insert: 'Cal', attributes: { bold: true } },
        { insert: 'looh' },
      ]),
      new Delta([
        { insert: 'm' },
        {
          insert: 'H',
          attributes: { italic: true, detectionId: '6', color: 'red' },
        },
        {
          insert: 'e',
          attributes: { font: 'sans-serif', italic: true, detectionId: '6' },
        },
        {
          insert: 'a',
          attributes: {
            italic: true,
            font: 'monospace',
            color: 'yellow',
            bold: true,
            detectionId: '7',
          },
        },
        {
          insert: 'n',
          attributes: {
            italic: true,
            font: 'monospace',
            color: 'yellow',
          },
        },
        { insert: 'wood' },
        { insert: 'to', attributes: { color: 'purple' } },
        { insert: 2, attributes: { color: 'purple', font: 'serif' } },
        { insert: { url: 'http://quilljs.com' } },
        { insert: 'ves', attributes: { color: 'purple' } },
        {
          insert: 'x',
          attributes: { color: 'yellow', bold: true },
        },
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
            detectionId: '5',
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
        { insert: 'Cal', attributes: { bold: true } },
        { insert: 'looh' },
      ]),
    ];

    for (let i = 0; i < expected.length - 1; i++) {
      const initialDoc = expected[i];
      const op = ops[i];
      const expectedDoc = expected[i + 1];
      expect(initialDoc.compose(op)).toEqual(expectedDoc);
    }
  });

  it('e', () => {
    const initialDoc = new Delta([
      { insert: 'm' },
      {
        insert: 'H',
        attributes: {
          italic: true,
          detectionId: '609abe0d-8f37-4d7d-813a-a7b35ef60cc6',
          color: 'red',
        },
      },
      {
        insert: 'e',
        attributes: {
          font: 'sans-serif',
          italic: true,
          detectionId: '609abe0d-8f37-4d7d-813a-a7b35ef60cc6',
        },
      },
      {
        insert: 'a',
        attributes: {
          italic: true,
          font: 'monospace',
          color: 'yellow',
          bold: true,
          detectionId: 'ee1c76bc-ecda-4fa3-8166-6cf5aac85104',
        },
      },
      {
        insert: 'n',
        attributes: { italic: true, font: 'monospace', color: 'yellow' },
      },
      { insert: 'wood' },
      { insert: 'to', attributes: { color: 'purple' } },
      { insert: 2, attributes: { color: 'purple', font: 'serif' } },
      { insert: { url: 'http://quilljs.com' } },
      { insert: 'ves', attributes: { color: 'purple' } },
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
    const ops = [
      new Delta([
        { retain: 3 },
        {
          insert: 2,
          attributes: {
            font: 'sans-serif',
            italic: true,
            detectionId: 'a33725f5-8c7d-42fc-9eef-5bc4f55b1dfa',
          },
        },
      ]),
      new Delta([
        { retain: 3 },
        {
          insert: 1,
          attributes: {
            color: 'green',
            bold: true,
            italic: true,
            detectionId: 'c7fb3482-3235-40e1-9cda-9e80877cc020',
          },
        },
      ]),
      new Delta([
        { retain: 3 },
        { insert: 'Jubjub' },
        { retain: 3 },
        { delete: 1 },
      ]),
      new Delta([
        { retain: 5 },
        { insert: 'dead' },
        { retain: 5 },
        { insert: 'rested' },
      ]),
      new Delta([{ retain: 5 }, { delete: 1 }]),
    ];

    const finalDoc = new Delta([
      { insert: 'm' },
      {
        insert: 'H',
        attributes: {
          italic: true,
          detectionId: '609abe0d-8f37-4d7d-813a-a7b35ef60cc6',
          color: 'red',
        },
      },
      {
        insert: 'e',
        attributes: {
          font: 'sans-serif',
          italic: true,
          detectionId: '609abe0d-8f37-4d7d-813a-a7b35ef60cc6',
        },
      },
      { insert: 'Jueadbjub' },
      {
        insert: 1,
        attributes: {
          color: 'green',
          bold: true,
          italic: true,
          detectionId: 'c7fb3482-3235-40e1-9cda-9e80877cc020',
        },
      },
      { insert: 'rested' },
      {
        insert: 2,
        attributes: {
          font: 'sans-serif',
          italic: true,
          detectionId: 'a33725f5-8c7d-42fc-9eef-5bc4f55b1dfa',
        },
      },
      {
        insert: 'a',
        attributes: {
          italic: true,
          font: 'monospace',
          color: 'yellow',
          bold: true,
          detectionId: 'ee1c76bc-ecda-4fa3-8166-6cf5aac85104',
        },
      },
      { insert: 'wood' },
      { insert: 'to', attributes: { color: 'purple' } },
      { insert: 2, attributes: { color: 'purple', font: 'serif' } },
      { insert: { url: 'http://quilljs.com' } },
      { insert: 'ves', attributes: { color: 'purple' } },
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

    let s = initialDoc;
    ops.forEach((op) => {
      s = new Delta(s).compose(new Delta(op));
    });
    expect(s).toEqual(finalDoc);
  });

  it('asdasdasd', () => {
    const doc = new Delta([
      { insert: 'rmi' },
      {
        insert: { image: 'http://quilljs.com' },
        attributes: { color: 'yellow', font: 'sans-serif' },
      },
      { insert: 'ms' },
      {
        insert: 'y',
        attributes: {
          font: 'serif',
          italic: true,
          detectionId: '977848c0-defb-437b-ae7d-9f60e0c93aa0',
        },
      },
      {
        insert: 'o',
        attributes: {
          font: 'serif',
          italic: true,
          detectionId: '977848c0-defb-437b-ae7d-9f60e0c93aa0',
          color: 'red',
        },
      },
      { insert: 'ug', attributes: { color: 'red', italic: true } },
      { insert: 'h' },
      { insert: 2, attributes: { bold: true } },
      { insert: 'e' },
      { insert: 'ab', attributes: { color: 'green' } },
      { insert: 'thoue' },
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

    const ops = [
      new Delta([
        {
          insert: 'Jabberwock',
          attributes: { color: 'red', font: 'serif', italic: true },
        },
        { delete: 4 },
        { retain: 5 },
        {
          retain: 1,
          attributes: {
            color: 'yellow',
            bold: true,
            detectionId: '0b2ecb5a-a7c7-4b16-855a-fda3a9e66d3b',
          },
        },
        { delete: 1 },
      ]),
      new Delta([
        { retain: 3 },
        {
          insert: 2,
          attributes: { font: 'serif', bold: true, italic: true },
        },
      ]),
      new Delta([
        { insert: 'in', attributes: { bold: true } },
        { retain: 4 },
        { delete: 1 },
      ]),
      new Delta([
        { retain: 2 },
        { insert: 2, attributes: { color: 'purple' } },
      ]),
      new Delta([
        { retain: 2 },
        {
          retain: 3,
          attributes: {
            color: null,
            detectionId: 'a5294df6-b261-4455-86a1-e7a01f78c584',
          },
        },
        { retain: 4 },
        {
          retain: 2,
          attributes: {
            color: 'blue',
            detectionId: '1c5a9144-8610-4f86-a419-fb2ac04572cb',
          },
        },
        {
          retain: 4,
          attributes: {
            bold: true,
            detectionId: '210ea74d-f4f9-443b-8c5b-af89ea1615c9',
          },
        },
        { retain: 4 },
        { insert: 'the' },
      ]),
    ];

    const res = new Delta([
      { insert: 'in', attributes: { bold: true } },
      {
        insert: 2,
        attributes: { detectionId: 'a5294df6-b261-4455-86a1-e7a01f78c584' },
      },
      {
        insert: 'Ja',
        attributes: {
          font: 'serif',
          italic: true,
          detectionId: 'a5294df6-b261-4455-86a1-e7a01f78c584',
        },
      },
      {
        insert: 'b',
        attributes: { color: 'red', font: 'serif', italic: true },
      },
      {
        insert: 2,
        attributes: { font: 'serif', bold: true, italic: true },
      },
      {
        insert: 'er',
        attributes: { color: 'red', font: 'serif', italic: true },
      },
      {
        insert: 'wo',
        attributes: {
          color: 'blue',
          font: 'serif',
          italic: true,
          detectionId: '1c5a9144-8610-4f86-a419-fb2ac04572cb',
        },
      },
      {
        insert: 'ck',
        attributes: {
          color: 'red',
          font: 'serif',
          italic: true,
          bold: true,
          detectionId: '210ea74d-f4f9-443b-8c5b-af89ea1615c9',
        },
      },
      {
        insert: 'ms',
        attributes: {
          bold: true,
          detectionId: '210ea74d-f4f9-443b-8c5b-af89ea1615c9',
        },
      },
      {
        insert: 'y',
        attributes: {
          font: 'serif',
          italic: true,
          detectionId: '977848c0-defb-437b-ae7d-9f60e0c93aa0',
        },
      },
      {
        insert: 'o',
        attributes: {
          font: 'serif',
          italic: true,
          detectionId: '977848c0-defb-437b-ae7d-9f60e0c93aa0',
          color: 'red',
        },
      },
      { insert: 'u', attributes: { color: 'red', italic: true } },
      {
        insert: 'g',
        attributes: {
          color: 'yellow',
          italic: true,
          bold: true,
          detectionId: '0b2ecb5a-a7c7-4b16-855a-fda3a9e66d3b',
        },
      },
      { insert: 'the' },
      { insert: 2, attributes: { bold: true } },
      { insert: 'e' },
      { insert: 'ab', attributes: { color: 'green' } },
      { insert: 'thoue' },
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

    const composed = ops.reduce((acc, op) => acc.compose(op));
    expect(doc.compose(composed)).toEqual(res);
  });

  it('f', () => {
    const doc = new Delta([
      { insert: 'and' },
      {
        insert: 2,
        attributes: { color: 'red', font: 'serif', italic: true },
      },
      {
        insert: 1,
        attributes: {
          color: 'red',
          font: 'monospace',
          detectionId: 'a5496ec4-8e5c-4da6-a0a9-2ff2ce55de1f',
        },
      },
      {
        insert: { image: 'http://quilljs.com' },
        attributes: { color: 'yellow', font: 'sans-serif' },
      },
      { insert: 'awhile' },
      { insert: 'gyre', attributes: { bold: true, italic: true } },
      { insert: 'w' },
      { insert: 2, attributes: { font: 'sans-serif', italic: true } },
      { insert: 'u', attributes: { italic: true } },
      { insert: 'ff' },
      { insert: 'ish', attributes: { italic: true } },
      { insert: 'h' },
      { insert: 'i', attributes: { color: 'green', italic: true } },
      { insert: 'ffl' },
      {
        insert: 'ng',
        attributes: {
          bold: true,
          detectionId: '50bd9de5-de2e-4c12-9ce8-e5d154c56156',
        },
      },
      { insert: 'm', attributes: { font: 'sans-serif', bold: true } },
      { insert: 'So' },
      { insert: 'y', attributes: { font: 'serif', italic: true } },
      {
        insert: 2,
        attributes: {
          color: 'purple',
          font: 'monospace',
          detectionId: '0e8c5efc-d4be-4514-843e-c5515e126f4a',
        },
      },
      {
        insert: 'o',
        attributes: { font: 'serif', italic: true, color: 'orange' },
      },
      {
        insert: { image: 'http://quilljs.com' },
        attributes: { color: 'orange' },
      },
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

    const ops = [
      new Delta([
        { retain: 4 },
        { delete: 2 },
        { retain: 5 },
        { insert: 'wabe' },
        { retain: 3 },
        { delete: 3 },
      ]),
      new Delta([
        { retain: 1 },
        { delete: 1 },
        { retain: 4 },
        { delete: 2 },
        { retain: 4 },
        {
          retain: 1,
          attributes: { detectionId: 'aebfa4cc-d65c-4050-846e-a26518764f4f' },
        },
        { delete: 1 },
        { retain: 4 },
        { delete: 1 },
        { retain: 3 },
        { delete: 2 },
      ]),
      new Delta([
        { retain: 5 },
        { delete: 3 },
        { retain: 2 },
        { insert: 'Long' },
        { retain: 2 },
        {
          retain: 4,
          attributes: {
            font: null,
            italic: null,
            detectionId: '777afdc4-8446-4c60-a59e-2e6a751097ce',
          },
        },
        { retain: 2 },
        { delete: 2 },
        { retain: 1 },
        {
          retain: 2,
          attributes: {
            color: 'green',
            font: 'monospace',
            bold: null,
            italic: null,
          },
        },
      ]),
      new Delta([
        { retain: 1 },
        { delete: 4 },
        { retain: 1 },
        {
          insert: 'day',
          attributes: { color: 'yellow', font: 'sans-serif' },
        },
        {
          insert: { url: 'http://quilljs.com' },
          attributes: { font: 'sans-serif', italic: true },
        },
      ]),
      new Delta([{ retain: 1 }, { retain: 4, attributes: { font: 'serif' } }]),
    ];

    const res = new Delta([
      { insert: 'a' },
      { insert: 'b', attributes: { font: 'serif' } },
      { insert: 'day', attributes: { color: 'yellow', font: 'serif' } },
      {
        insert: { url: 'http://quilljs.com' },
        attributes: { font: 'sans-serif', italic: true },
      },
      {
        insert: 'e',
        attributes: { detectionId: 'aebfa4cc-d65c-4050-846e-a26518764f4f' },
      },
      { insert: 'Long' },
      { insert: 'gy', attributes: { bold: true, italic: true } },
      {
        insert: 2,
        attributes: { detectionId: '777afdc4-8446-4c60-a59e-2e6a751097ce' },
      },
      {
        insert: 'ufi',
        attributes: { detectionId: '777afdc4-8446-4c60-a59e-2e6a751097ce' },
      },
      { insert: 's', attributes: { italic: true } },
      { insert: 'i', attributes: { color: 'green', italic: true } },
      { insert: 'l' },
      {
        insert: 'ng',
        attributes: {
          detectionId: '50bd9de5-de2e-4c12-9ce8-e5d154c56156',
          color: 'green',
          font: 'monospace',
        },
      },
      { insert: 'm', attributes: { font: 'sans-serif', bold: true } },
      { insert: 'So' },
      { insert: 'y', attributes: { font: 'serif', italic: true } },
      {
        insert: 2,
        attributes: {
          color: 'purple',
          font: 'monospace',
          detectionId: '0e8c5efc-d4be-4514-843e-c5515e126f4a',
        },
      },
      {
        insert: 'o',
        attributes: { font: 'serif', italic: true, color: 'orange' },
      },
      {
        insert: { image: 'http://quilljs.com' },
        attributes: { color: 'orange' },
      },
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

    const composed = ops.reduce((acc, op) => acc.compose(op));

    expect(doc.compose(composed)).toEqual(res);
  });

  it('g', () => {
    const doc = new Delta([
      {
        insert: 1,
        attributes: {
          bold: true,
          detectionId: '4fff9e92-e14f-4cfe-8e9a-6f0e0c1eb9f9',
        },
      },
      {
        insert: 2,
        attributes: { color: 'green', font: 'sans-serif', italic: true },
      },
      {
        insert: 'e',
        attributes: { detectionId: '1548ffc2-299d-4727-b47f-bf77f5d3e0a1' },
      },
      {
        insert: 'T',
        attributes: { italic: true, color: 'blue', font: 'serif' },
      },
      { insert: 'ra' },
      { insert: 't', attributes: { font: 'sans-serif', bold: true } },
      { insert: 'ca', attributes: { color: 'blue' } },
      { insert: 'he', attributes: { font: 'sans-serif', bold: true } },
      { insert: 'sh', attributes: { italic: true } },
      { insert: 'h' },
      { insert: 'i', attributes: { color: 'green', italic: true } },
      { insert: 'ffl' },
      {
        insert: 'ng',
        attributes: {
          bold: true,
          detectionId: '50bd9de5-de2e-4c12-9ce8-e5d154c56156',
        },
      },
      { insert: 'm', attributes: { font: 'sans-serif', bold: true } },
      { insert: 'So' },
      { insert: 'y', attributes: { font: 'serif', italic: true } },
      {
        insert: 2,
        attributes: {
          color: 'purple',
          font: 'monospace',
          detectionId: '0e8c5efc-d4be-4514-843e-c5515e126f4a',
        },
      },
      {
        insert: 'o',
        attributes: { font: 'serif', italic: true, color: 'orange' },
      },
      {
        insert: { image: 'http://quilljs.com' },
        attributes: { color: 'orange' },
      },
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
    const res = new Delta([
      {
        insert: 1,
        attributes: {
          bold: true,
          detectionId: '4fff9e92-e14f-4cfe-8e9a-6f0e0c1eb9f9',
        },
      },
      {
        insert: 2,
        attributes: { color: 'green', font: 'sans-serif', italic: true },
      },
      {
        insert: 'e',
        attributes: { detectionId: '1548ffc2-299d-4727-b47f-bf77f5d3e0a1' },
      },
      { insert: 'h', attributes: { color: 'yellow' } },
      { insert: 'The' },
      { insert: 'i', attributes: { color: 'yellow' } },
      {
        insert: 'st',
        attributes: {
          font: 'sans-serif',
          bold: true,
          color: 'blue',
          italic: true,
          detectionId: 'e8df1807-830b-435e-812a-5510d870488d',
        },
      },
      { insert: 'c', attributes: { color: 'blue' } },
      { insert: 'borogoves', attributes: { italic: true } },
      { insert: 'iandts' },
      { insert: 'a', attributes: { color: 'blue' } },
      { insert: 'he', attributes: { font: 'sans-serif', bold: true } },
      { insert: 'i', attributes: { color: 'green', italic: true } },
      { insert: 'f' },
      {
        insert: 'fl',
        attributes: {
          color: 'orange',
          detectionId: '5823be0b-20b1-42c2-bde4-5447595cfe1e',
        },
      },
      {
        insert: 'n',
        attributes: {
          bold: true,
          detectionId: '5823be0b-20b1-42c2-bde4-5447595cfe1e',
          color: 'orange',
        },
      },
      { insert: 'g', attributes: { bold: true } },
      { insert: 'm', attributes: { font: 'sans-serif', bold: true } },
      { insert: 'So' },
      {
        insert: { image: 'http://quilljs.com' },
        attributes: {
          font: 'monospace',
          detectionId: '063c0801-19e3-4b08-acab-245510f766ab',
        },
      },
      { insert: 'y', attributes: { font: 'serif', italic: true } },
      {
        insert: 2,
        attributes: {
          color: 'purple',
          font: 'monospace',
          detectionId: '0e8c5efc-d4be-4514-843e-c5515e126f4a',
        },
      },
      {
        insert: 'o',
        attributes: { font: 'serif', italic: true, color: 'orange' },
      },
      {
        insert: { image: 'http://quilljs.com' },
        attributes: { color: 'orange' },
      },
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
    const ops = [
      new Delta([
        { retain: 3 },
        { insert: 'his', attributes: { color: 'yellow' } },
        { delete: 3 },
        { retain: 2 },
        { insert: 'its' },
      ]),
      new Delta([
        { retain: 5 },
        {
          retain: 2,
          attributes: {
            color: 'blue',
            font: 'sans-serif',
            bold: true,
            italic: true,
            detectionId: 'e8df1807-830b-435e-812a-5510d870488d',
          },
        },
        { retain: 1 },
        { insert: 'borogoves', attributes: { italic: true } },
        { retain: 1 },
        { insert: 'and' },
        { retain: 5 },
        { delete: 3 },
        { retain: 2 },
        {
          retain: 3,
          attributes: {
            color: 'orange',
            detectionId: '5823be0b-20b1-42c2-bde4-5447595cfe1e',
          },
        },
        { retain: 4 },
        {
          insert: { image: 'http://quilljs.com' },
          attributes: {
            font: 'monospace',
            detectionId: '063c0801-19e3-4b08-acab-245510f766ab',
          },
        },
      ]),
      new Delta([{ retain: 4 }, { insert: 'The' }]),
    ];

    const composed = ops.reduce((acc, op) => acc.compose(op));
    expect(doc.compose(composed)).toEqual(res);
  });

  xit('1', () => {
    const doc = new Delta([
      { insert: 'm' },
      {
        attributes: { color: 'red', italic: true, detectionId: '0' },
        insert: 'H',
      },
      {
        attributes: { font: 'sans-serif', italic: true, detectionId: '0' },
        insert: 'e',
      },
      {
        attributes: {
          bold: true,
          detectionId: '1',
          italic: true,
          font: 'monospace',
          color: 'yellow',
        },
        insert: 'a',
      },
      {
        attributes: {
          italic: true,
          font: 'monospace',
          color: 'yellow',
          detectionId: '6',
        },
        insert: 'n',
      },
      { insert: 'wood' },
      { insert: 'to', attributes: { color: 'purple' } },
      { attributes: { color: 'purple', font: 'serif' }, insert: 2 },
      { insert: { url: 'http://quilljs.com' } },
      { insert: 'ves', attributes: { color: 'purple' } },
      {
        insert: 'x',
        attributes: { bold: true, color: 'yellow', detectionId: '6' },
      },
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
          detectionId: '5',
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
      { insert: 'Cal', attributes: { bold: true } },
      { insert: 'looh' },
    ]);

    const op1 = new Delta([
      { retain: 3 },
      { insert: 'toves', attributes: { color: 'purple' } },
    ]);

    const op2 = new Delta([
      { retain: 1 },
      {
        insert: 'He',
        attributes: { font: 'sans-serif', italic: true, detectionId: '0' },
      },
    ]);

    const op3 = new Delta([
      { retain: 3 },
      { retain: 1, attributes: { bold: true, detectionId: '1' } },
    ]);

    const op4 = new Delta([
      { retain: 1 },
      { retain: 1, attributes: { color: 'red', font: null, bold: null } },
      { retain: 3 },
      { retain: 2, attributes: { bold: null } },
      { insert: 2, attributes: { color: 'purple', font: 'serif' } },
      { insert: { url: 'http://quilljs.com' } },
      { retain: 3 },
      { retain: 2, attributes: { bold: true, italic: null } },
      { insert: 'snack' },
    ]);

    const op5 = new Delta([{ retain: 5 }, { insert: 'wood' }]);

    const expected = new Delta([
      { insert: 'm' },
      {
        insert: 'H',
        attributes: { italic: true, detectionId: '0', color: 'red' },
      },
      {
        insert: 'e',
        attributes: { font: 'sans-serif', italic: true, detectionId: '0' },
      },
      {
        insert: 'a',
        attributes: {
          italic: true,
          font: 'monospace',
          color: 'yellow',
          bold: true,
          detectionId: '1',
        },
      },
      {
        insert: 'n',
        attributes: { italic: true, font: 'monospace', color: 'yellow' },
      },
      { insert: 'wood' },
      { insert: 'to', attributes: { color: 'purple' } },
      { insert: 2, attributes: { color: 'purple', font: 'serif' } },
      { insert: { url: 'http://quilljs.com' } },
      { insert: 'ves', attributes: { color: 'purple' } },
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
          detectionId: '5',
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
      { insert: 'Cal', attributes: { bold: true } },
      { insert: 'looh' },
    ]);

    expect(
      doc.compose(op1).compose(op2).compose(op3).compose(op4).compose(op5),
    ).toEqual(expected);
  });

  xit('2', () => {
    const doc = new Delta([
      { insert: 'i', attributes: { font: 'serif' } },
      {
        attributes: { color: 'blue', detectionId: '2' },
        insert: { url: 'http://quilljs.com' },
      },
      { insert: 't', attributes: { font: 'serif' } },
      {
        insert: { url: 'http://quilljs.com' },
        attributes: { color: 'yellow', italic: true },
      },
      { insert: 'm' },
      {
        insert: 'an',
        attributes: {
          italic: true,
          font: 'monospace',
          color: 'yellow',
          detectionId: '6',
        },
      },
      {
        insert: 'x',
        attributes: { color: 'orange', italic: true, detectionId: '6' },
      },
      { insert: 't', attributes: { color: 'orange', italic: true } },
      { attributes: { italic: true, detectionId: '0' }, insert: 'the' },
      { insert: 'h', attributes: { color: 'orange', italic: true } },
      { insert: 'r', attributes: { color: 'orange' } },
      { insert: 'theough' },
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
          detectionId: '5',
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
      { insert: 'Cal', attributes: { bold: true } },
      { insert: 'looh' },
    ]);

    const list = [
      new Delta([
        { retain: 3 },
        { retain: 3, attributes: { color: 'green', italic: true } },
      ]),
      new Delta([
        { retain: 3 },
        { retain: 4, attributes: { color: 'orange', bold: null } },
      ]),
      new Delta([
        {
          insert: { url: 'http://quilljs.com' },
          attributes: { color: 'yellow', italic: true },
        },
        { retain: 5 },
        { insert: 'the', attributes: { italic: true, detectionId: '0' } },
      ]),
      new Delta([
        { insert: 'it', attributes: { font: 'serif', detectionId: '1' } },
      ]),
      new Delta([
        { retain: 1 },
        {
          insert: { url: 'http://quilljs.com' },
          attributes: { color: 'blue', detectionId: '2' },
        },
      ]),
    ];

    const expected = new Delta([
      { insert: 'i', attributes: { font: 'serif' } },
      {
        insert: { url: 'http://quilljs.com' },
        attributes: { color: 'blue', detectionId: '2' },
      },
      { insert: 't', attributes: { font: 'serif' } },
      {
        insert: { url: 'http://quilljs.com' },
        attributes: { color: 'yellow', italic: true },
      },
      { insert: 'm' },
      {
        insert: 'an',
        attributes: {
          italic: true,
          font: 'monospace',
          color: 'yellow',
          detectionId: '6',
        },
      },
      {
        insert: 'x',
        attributes: { italic: true, color: 'orange', detectionId: '6' },
      },
      { insert: 't', attributes: { color: 'orange', italic: true } },
      { insert: 'the', attributes: { italic: true, detectionId: '0' } },
      { insert: 'h', attributes: { color: 'orange', italic: true } },
      { insert: 'r', attributes: { color: 'orange' } },
      { insert: 'theough' },
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
          detectionId: '5',
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
      { insert: 'Cal', attributes: { bold: true } },
      { insert: 'looh' },
    ]);

    let s = doc;
    list.forEach((delta) => {
      s = s.compose(delta);
    });
    expect(s).toEqual(expected);
  });
});
