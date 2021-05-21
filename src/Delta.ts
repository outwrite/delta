import diff from 'fast-diff';
import cloneDeep from 'lodash.clonedeep';
import isEqual from 'lodash.isequal';
import AttributeMap from './AttributeMap';
import Op from './Op';

const NULL_CHARACTER = String.fromCharCode(0); // Placeholder char for embed in diff()

function addMetaData(
  op: Op,
  thisOrOther: boolean,
  replaces?: string | null,
  original?: string | null,
): Op {
  const clone = cloneDeep(op);
  const attr = clone.attributes || {};
  attr.meta = { thisOrOther };
  if (typeof replaces !== 'undefined') {
    attr.meta.replaces = replaces;
  }
  if (typeof original !== 'undefined') {
    attr.meta.original = original;
  }
  clone.attributes = attr;
  return clone;
}

function addMetaDataAttribute(
  attributes: AttributeMap | undefined = {},
  thisOrOther: boolean,
  replaces?: string | null,
  original?: string | null,
): AttributeMap {
  attributes = { ...attributes, meta: { thisOrOther } };
  if (typeof replaces !== 'undefined') {
    attributes.meta.replaces = replaces;
  }
  if (typeof original !== 'undefined') {
    attributes.meta.original = original;
  }
  return attributes;
}

class Delta {
  static Op = Op;
  static AttributeMap = AttributeMap;

  ops: Op[];
  constructor(ops?: Op[] | { ops: Op[] }) {
    // Assume we are given a well formed ops
    if (Array.isArray(ops)) {
      this.ops = ops;
    } else if (ops != null && Array.isArray(ops.ops)) {
      this.ops = ops.ops;
    } else {
      this.ops = [];
    }
  }

  insert(arg: string | object, attributes?: AttributeMap): this {
    const newOp: Op = {};
    if (typeof arg === 'string' && arg.length === 0) {
      return this;
    }
    newOp.insert = arg;
    if (
      attributes != null &&
      typeof attributes === 'object' &&
      Object.keys(attributes).length > 0
    ) {
      newOp.attributes = attributes;
    }
    return this.push(newOp);
  }

  delete(length: number): this {
    if (length <= 0) {
      return this;
    }
    return this.push({ delete: length });
  }

  retain(length: number, attributes?: AttributeMap): this {
    if (length <= 0) {
      return this;
    }
    const newOp: Op = { retain: length };
    if (
      attributes != null &&
      typeof attributes === 'object' &&
      Object.keys(attributes).length > 0
    ) {
      newOp.attributes = attributes;
    }
    return this.push(newOp);
  }

  push(newOp: Op): this {
    let index = this.ops.length;
    let lastOp = this.ops[index - 1];
    newOp = cloneDeep(newOp);
    if (typeof lastOp === 'object') {
      if (
        typeof newOp.delete === 'number' &&
        typeof lastOp.delete === 'number'
      ) {
        this.ops[index - 1] = { delete: lastOp.delete + newOp.delete };
        return this;
      }
      // Since it does not matter if we insert before or after deleting at the same index,
      // always prefer to insert first
      if (typeof lastOp.delete === 'number' && newOp.insert != null) {
        index -= 1;
        lastOp = this.ops[index - 1];
        if (typeof lastOp !== 'object') {
          this.ops.unshift(newOp);
          return this;
        }
      }
      if (isEqual(newOp.attributes, lastOp.attributes)) {
        if (
          typeof newOp.insert === 'string' &&
          typeof lastOp.insert === 'string'
        ) {
          this.ops[index - 1] = { insert: lastOp.insert + newOp.insert };
          if (typeof newOp.attributes === 'object') {
            this.ops[index - 1].attributes = newOp.attributes;
          }
          return this;
        } else if (
          typeof newOp.retain === 'number' &&
          typeof lastOp.retain === 'number'
        ) {
          this.ops[index - 1] = { retain: lastOp.retain + newOp.retain };
          if (typeof newOp.attributes === 'object') {
            this.ops[index - 1].attributes = newOp.attributes;
          }
          return this;
        }
      }
    }
    if (index === this.ops.length) {
      this.ops.push(newOp);
    } else {
      this.ops.splice(index, 0, newOp);
    }
    return this;
  }

  chop(): this {
    const lastOp = this.ops[this.ops.length - 1];
    if (lastOp && lastOp.retain && !lastOp.attributes) {
      this.ops.pop();
    }
    return this;
  }

  filter(predicate: (op: Op, index: number) => boolean): Op[] {
    return this.ops.filter(predicate);
  }

  forEach(predicate: (op: Op, index: number) => void): void {
    this.ops.forEach(predicate);
  }

  map<T>(predicate: (op: Op, index: number) => T): T[] {
    return this.ops.map(predicate);
  }

  partition(predicate: (op: Op) => boolean): [Op[], Op[]] {
    const passed: Op[] = [];
    const failed: Op[] = [];
    this.forEach((op) => {
      const target = predicate(op) ? passed : failed;
      target.push(op);
    });
    return [passed, failed];
  }

  reduce<T>(
    predicate: (accum: T, curr: Op, index: number) => T,
    initialValue: T,
  ): T {
    return this.ops.reduce(predicate, initialValue);
  }

  changeLength(): number {
    return this.reduce((length, elem) => {
      if (elem.insert) {
        return length + Op.length(elem);
      } else if (elem.delete) {
        return length - elem.delete;
      }
      return length;
    }, 0);
  }

  length(): number {
    return this.reduce((length, elem) => {
      return length + Op.length(elem);
    }, 0);
  }

  slice(start = 0, end = Infinity): Delta {
    const ops = [];
    const iter = Op.iterator(this.ops);
    let index = 0;
    while (index < end && iter.hasNext()) {
      let nextOp;
      if (index < start) {
        nextOp = iter.next(start - index);
      } else {
        nextOp = iter.next(end - index);
        ops.push(nextOp);
      }
      index += Op.length(nextOp);
    }
    return new Delta(ops);
  }

  compose(other: Delta): Delta {
    const thisIter = Op.iterator(this.ops);
    const otherIter = Op.iterator(other.ops);

    let runningCursor = 0;
    const attributeMarker: {
      [id: string]: { start: number; end: number };
    } = {};
    const toRemove: { [id: string]: { this: boolean; other: boolean } } = {};

    const ops = [];
    const firstOther = otherIter.peek();
    if (
      firstOther != null &&
      typeof firstOther.retain === 'number' &&
      firstOther.attributes == null
    ) {
      let firstLeft = firstOther.retain;
      while (
        thisIter.peekType() === 'insert' &&
        thisIter.peekLength() <= firstLeft
      ) {
        const length = thisIter.peekLength();
        firstLeft -= length;
        const op = thisIter.next();
        if (op.attributes?.detectionId) {
          if (
            toRemove[op.attributes.detectionId] &&
            toRemove[op.attributes.detectionId].this &&
            toRemove[op.attributes.detectionId].other
          ) {
            // do nothing...
          } else {
            const thisEntry = {
              start: runningCursor,
              end: runningCursor + length,
            };
            const lastEntry = attributeMarker[op.attributes.detectionId];
            if (lastEntry && lastEntry.end < thisEntry.start) {
              toRemove[op.attributes.detectionId] = { this: true, other: true };
              delete attributeMarker[op.attributes.detectionId];
            } else {
              attributeMarker[op.attributes.detectionId] = thisEntry;
            }
          }
        }
        ops.push(op.attributes?.detectionId ? addMetaData(op, true) : op);
        runningCursor += length;
      }
      if (firstOther.retain - firstLeft > 0) {
        otherIter.next(firstOther.retain - firstLeft);
      }
    }
    const delta = new Delta(ops);
    while (thisIter.hasNext() || otherIter.hasNext()) {
      if (otherIter.peekType() === 'insert') {
        const op = otherIter.next();
        const length = Op.length(op);
        if (op.attributes?.detectionId) {
          if (
            toRemove[op.attributes.detectionId] &&
            toRemove[op.attributes.detectionId].this &&
            toRemove[op.attributes.detectionId].other
          ) {
            // do nothing...
          } else {
            const thisEntry = {
              start: runningCursor,
              end: runningCursor + length,
            };
            const lastEntry = attributeMarker[op.attributes.detectionId];
            if (lastEntry && lastEntry.end < thisEntry.start) {
              toRemove[op.attributes.detectionId] = { this: true, other: true };
              delete attributeMarker[op.attributes.detectionId];
            } else {
              attributeMarker[op.attributes.detectionId] = thisEntry;
            }
          }
        }
        delta.push(op.attributes?.detectionId ? addMetaData(op, false) : op);
        runningCursor += length;
      } else if (thisIter.peekType() === 'delete') {
        delta.push(thisIter.next());
      } else {
        const length = Math.min(thisIter.peekLength(), otherIter.peekLength());
        const thisOp = thisIter.next(length);
        const otherOp = otherIter.next(length);
        if (typeof otherOp.retain === 'number') {
          const newOp: Op = {};
          if (typeof thisOp.retain === 'number') {
            newOp.retain = length;
          } else {
            newOp.insert = thisOp.insert;
          }
          // Preserve null when composing with a retain, otherwise remove it for inserts
          const attributes = AttributeMap.compose(
            thisOp.attributes,
            otherOp.attributes,
            typeof thisOp.retain === 'number',
          );
          if (attributes) {
            newOp.attributes = attributes;
          }
          if (attributes?.detectionId) {
            if (
              toRemove[attributes.detectionId] &&
              toRemove[attributes.detectionId].this &&
              toRemove[attributes.detectionId].other
            ) {
              // do nothing...
            } else {
              const thisEntry = {
                start: runningCursor,
                end: runningCursor + length,
              };
              const lastEntry = attributeMarker[attributes.detectionId];
              if (lastEntry && lastEntry.end < thisEntry.start) {
                toRemove[attributes.detectionId] = { this: true, other: true };
                delete attributeMarker[attributes.detectionId];
              } else {
                attributeMarker[attributes.detectionId] = thisEntry;
              }
            }

            // One detectionId got erased!!!
            if (
              thisOp.attributes?.detectionId &&
              otherOp.attributes?.detectionId
            ) {
              const thisOrOther =
                thisOp.attributes.detectionId !== attributes.detectionId
                  ? 'this'
                  : 'other';
              const detId =
                thisOrOther === 'this'
                  ? thisOp.attributes.detectionId
                  : otherOp.attributes.detectionId;

              const removalStatus = toRemove[detId] || {
                this: false,
                other: false,
              };
              toRemove[detId] = { ...removalStatus, [thisOrOther]: true };
              if (
                toRemove[detId] &&
                toRemove[detId].this &&
                toRemove[detId].other
              ) {
                delete attributeMarker[detId];
              }
            }
          } else if (
            thisOp.attributes?.detectionId &&
            otherOp.attributes?.detectionId === null
          ) {
            const removalStatus = toRemove[thisOp.attributes.detectionId] || {
              this: false,
              other: false,
            };
            toRemove[thisOp.attributes.detectionId] = {
              ...removalStatus,
              this: true,
            };
            if (
              toRemove[thisOp.attributes.detectionId] &&
              toRemove[thisOp.attributes.detectionId].this &&
              toRemove[thisOp.attributes.detectionId].other
            ) {
              delete attributeMarker[thisOp.attributes.detectionId];
            }
          }

          delta.push(
            typeof attributes?.detectionId !== 'undefined'
              ? addMetaData(
                  newOp,
                  thisOp.attributes?.detectionId === attributes?.detectionId,
                )
              : newOp,
          );

          runningCursor += length;

          // Optimization if rest of other is just retain
          if (
            !otherIter.hasNext() &&
            isEqual(delta.ops[delta.ops.length - 1], newOp)
          ) {
            const rest = new Delta(thisIter.rest());

            const validatedRest = cloneDeep(rest.ops).map((op) => {
              if (
                op.attributes?.detectionId &&
                toRemove[op.attributes.detectionId] &&
                toRemove[op.attributes.detectionId].this
              ) {
                const newOp = cloneDeep(op);
                let newAttributes = newOp.attributes;
                if (op.retain) {
                  newAttributes = { ...newAttributes, detectionId: null };
                } else if (newAttributes) {
                  delete newAttributes['detectionId'];
                }
                if (newAttributes && Object.keys(newAttributes).length === 0) {
                  delete newOp['attributes'];
                  return newOp;
                }
                return { ...newOp, attributes: newAttributes };
              } else {
                return op;
              }
            });

            const newDelta = new Delta();
            cloneDeep(delta.ops).forEach((op) => {
              let attributes = op.attributes;
              if (attributes?.detectionId) {
                if (typeof attributes.meta === 'undefined') {
                  throw Error(
                    'if an attribute has a detection it should have meta info',
                  );
                }
                const thisOrOther = attributes.meta.thisOrOther
                  ? 'this'
                  : 'other';
                const shouldDelete =
                  toRemove[attributes.detectionId] &&
                  toRemove[attributes.detectionId][thisOrOther];

                if (shouldDelete) {
                  if (typeof op.retain === 'number') {
                    attributes = { ...op.attributes, detectionId: null };
                  } else {
                    delete attributes['detectionId'];
                  }
                }
              }
              if (attributes) {
                delete attributes['meta'];
              }
              if (!attributes || Object.keys(attributes).length === 0) {
                delete op['attributes'];
                newDelta.push({ ...op });
              } else {
                newDelta.push({ ...op, attributes });
              }
            });

            return newDelta.concat(new Delta(validatedRest)).chop();
          }

          // Other op should be delete, we could be an insert or retain
          // Insert + delete cancels out
        } else if (
          typeof otherOp.delete === 'number' &&
          typeof thisOp.retain === 'number'
        ) {
          if (thisOp.attributes?.detectionId) {
            const removalStatus = toRemove[thisOp.attributes.detectionId] || {
              this: false,
              other: false,
            };
            toRemove[thisOp.attributes.detectionId] = {
              ...removalStatus,
              this: true,
            };
            if (
              toRemove[thisOp.attributes.detectionId] &&
              toRemove[thisOp.attributes.detectionId].this &&
              toRemove[thisOp.attributes.detectionId].other
            ) {
              delete attributeMarker[thisOp.attributes.detectionId];
            }
          }
          delta.push(otherOp);
        } else {
          if (thisOp.attributes?.detectionId) {
            const removalStatus = toRemove[thisOp.attributes.detectionId] || {
              this: false,
              other: false,
            };
            toRemove[thisOp.attributes.detectionId] = {
              ...removalStatus,
              this: true,
            };
            if (
              toRemove[thisOp.attributes.detectionId] &&
              toRemove[thisOp.attributes.detectionId].this &&
              toRemove[thisOp.attributes.detectionId].other
            ) {
              delete attributeMarker[thisOp.attributes.detectionId];
            }
          }
        }
      }
    }

    const newDelta = new Delta();
    cloneDeep(delta.ops).forEach((op) => {
      let attributes = op.attributes;
      if (
        attributes?.detectionId &&
        typeof attributes.meta.thisOrOther !== 'undefined'
      ) {
        const thisOrOther = attributes.meta.thisOrOther ? 'this' : 'other';
        const shouldDelete =
          toRemove[attributes.detectionId] &&
          toRemove[attributes.detectionId][thisOrOther];

        if (shouldDelete) {
          if (typeof op.retain === 'number') {
            attributes = { ...op.attributes, detectionId: null };
          } else {
            delete attributes['detectionId'];
          }
        }
      }
      if (attributes) {
        delete attributes['meta'];
      }
      if (!attributes || Object.keys(attributes).length === 0) {
        delete op['attributes'];
        newDelta.push({ ...op });
      } else {
        newDelta.push({ ...op, attributes });
      }
    });
    return newDelta.chop();
  }

  concat(other: Delta): Delta {
    const delta = new Delta(this.ops.slice());
    if (other.ops.length > 0) {
      delta.push(other.ops[0]);
      delta.ops = delta.ops.concat(other.ops.slice(1));
    }
    return delta;
  }

  diff(other: Delta, cursor?: number | diff.CursorInfo): Delta {
    if (this.ops === other.ops) {
      return new Delta();
    }
    const strings = [this, other].map((delta) => {
      return delta
        .map((op) => {
          if (op.insert != null) {
            return typeof op.insert === 'string' ? op.insert : NULL_CHARACTER;
          }
          const prep = delta === other ? 'on' : 'with';
          throw new Error('diff() called ' + prep + ' non-document');
        })
        .join('');
    });
    const retDelta = new Delta();
    const diffResult = diff(strings[0], strings[1], cursor);
    const thisIter = Op.iterator(this.ops);
    const otherIter = Op.iterator(other.ops);
    diffResult.forEach((component: diff.Diff) => {
      let length = component[1].length;
      while (length > 0) {
        let opLength = 0;
        switch (component[0]) {
          case diff.INSERT:
            opLength = Math.min(otherIter.peekLength(), length);
            retDelta.push(otherIter.next(opLength));
            break;
          case diff.DELETE:
            opLength = Math.min(length, thisIter.peekLength());
            thisIter.next(opLength);
            retDelta.delete(opLength);
            break;
          case diff.EQUAL:
            opLength = Math.min(
              thisIter.peekLength(),
              otherIter.peekLength(),
              length,
            );
            const thisOp = thisIter.next(opLength);
            const otherOp = otherIter.next(opLength);
            if (isEqual(thisOp.insert, otherOp.insert)) {
              retDelta.retain(
                opLength,
                AttributeMap.diff(thisOp.attributes, otherOp.attributes),
              );
            } else {
              retDelta.push(otherOp).delete(opLength);
            }
            break;
        }
        length -= opLength;
      }
    });
    return retDelta.chop();
  }

  eachLine(
    predicate: (
      line: Delta,
      attributes: AttributeMap,
      index: number,
    ) => boolean | void,
    newline = '\n',
  ): void {
    const iter = Op.iterator(this.ops);
    let line = new Delta();
    let i = 0;
    while (iter.hasNext()) {
      if (iter.peekType() !== 'insert') {
        return;
      }
      const thisOp = iter.peek();
      const start = Op.length(thisOp) - iter.peekLength();
      const index =
        typeof thisOp.insert === 'string'
          ? thisOp.insert.indexOf(newline, start) - start
          : -1;
      if (index < 0) {
        line.push(iter.next());
      } else if (index > 0) {
        line.push(iter.next(index));
      } else {
        if (predicate(line, iter.next(1).attributes || {}, i) === false) {
          return;
        }
        i += 1;
        line = new Delta();
      }
    }
    if (line.length() > 0) {
      predicate(line, {}, i);
    }
  }

  invert(base: Delta): Delta {
    const inverted = new Delta();
    this.reduce((baseIndex, op) => {
      if (op.insert) {
        inverted.delete(Op.length(op));
      } else if (op.retain && op.attributes == null) {
        inverted.retain(op.retain);
        return baseIndex + op.retain;
      } else if (op.delete || (op.retain && op.attributes)) {
        const length = (op.delete || op.retain) as number;
        const slice = base.slice(baseIndex, baseIndex + length);
        slice.forEach((baseOp) => {
          if (op.delete) {
            inverted.push(baseOp);
          } else if (op.retain && op.attributes) {
            inverted.retain(
              Op.length(baseOp),
              AttributeMap.invert(op.attributes, baseOp.attributes),
            );
          }
        });
        return baseIndex + length;
      }
      return baseIndex;
    }, 0);
    return inverted.chop();
  }

  transform(index: number, priority?: boolean): number;
  transform(other: Delta, priority?: boolean): Delta;
  transform(arg: number | Delta, priority = false): typeof arg {
    priority = !!priority;
    if (typeof arg === 'number') {
      return this.transformPosition(arg, priority);
    }
    const other: Delta = arg;
    const thisIter = Op.iterator(this.ops);
    const otherIter = Op.iterator(other.ops);
    const delta = new Delta();

    let runningCursor = 0;
    const attributeMarker: {
      [id: string]: { start: number; end: number };
    } = {};
    const toRemove: { [id: string]: { this: boolean; other: boolean } } = {};

    while (thisIter.hasNext() || otherIter.hasNext()) {
      if (
        thisIter.peekType() === 'insert' &&
        (priority || otherIter.peekType() !== 'insert')
      ) {
        const op = thisIter.next();
        const length = Op.length(op);

        if (op.attributes?.detectionId) {
          if (
            toRemove[op.attributes.detectionId] &&
            toRemove[op.attributes.detectionId].this &&
            toRemove[op.attributes.detectionId].other
          ) {
            // do nothing...
          } else {
            const thisEntry = {
              start: runningCursor,
              end: runningCursor + length,
            };
            const lastEntry = attributeMarker[op.attributes.detectionId];
            if (lastEntry && lastEntry.end < thisEntry.start) {
              toRemove[op.attributes.detectionId] = { this: true, other: true };
              delete attributeMarker[op.attributes.detectionId];
            } else {
              attributeMarker[op.attributes.detectionId] = thisEntry;
            }
          }
        }

        delta.retain(
          length,
          addMetaDataAttribute(
            undefined,
            true,
            undefined,
            op.attributes?.detectionId,
          ),
        );

        runningCursor += length;
      } else if (otherIter.peekType() === 'insert') {
        const op = otherIter.next();
        const length = Op.length(op);

        if (op.attributes?.detectionId) {
          if (
            toRemove[op.attributes.detectionId] &&
            toRemove[op.attributes.detectionId].this &&
            toRemove[op.attributes.detectionId].other
          ) {
            // do nothing...
          } else {
            const thisEntry = {
              start: runningCursor,
              end: runningCursor + length,
            };
            const lastEntry = attributeMarker[op.attributes.detectionId];
            if (lastEntry && lastEntry.end < thisEntry.start) {
              toRemove[op.attributes.detectionId] = { this: true, other: true };
              delete attributeMarker[op.attributes.detectionId];
            } else {
              attributeMarker[op.attributes.detectionId] = thisEntry;
            }
          }
        }

        delta.push(op.attributes?.detectionId ? addMetaData(op, false) : op);

        runningCursor += length;
      } else {
        const length = Math.min(thisIter.peekLength(), otherIter.peekLength());
        const thisOp = thisIter.next(length);
        const otherOp = otherIter.next(length);

        if (thisOp.delete) {
          if (otherOp.attributes?.detectionId) {
            const removalStatus = toRemove[otherOp.attributes.detectionId] || {
              this: false,
              other: false,
            };
            toRemove[otherOp.attributes.detectionId] = {
              ...removalStatus,
              other: true,
            };
            if (
              toRemove[otherOp.attributes.detectionId] &&
              toRemove[otherOp.attributes.detectionId].this &&
              toRemove[otherOp.attributes.detectionId].other
            ) {
              delete attributeMarker[otherOp.attributes.detectionId];
            }
          }

          // Our delete either makes their delete redundant or removes their retain
          continue;
        } else if (otherOp.delete) {
          if (thisOp.attributes?.detectionId) {
            const removalStatus = toRemove[thisOp.attributes.detectionId] || {
              this: false,
              other: false,
            };
            toRemove[thisOp.attributes.detectionId] = {
              ...removalStatus,
              this: true,
            };
            if (
              toRemove[thisOp.attributes.detectionId] &&
              toRemove[thisOp.attributes.detectionId].this &&
              toRemove[thisOp.attributes.detectionId].other
            ) {
              delete attributeMarker[thisOp.attributes.detectionId];
            }
          }

          delta.push(otherOp);
        } else {
          // We retain either their retain or insert
          let attributes = AttributeMap.transform(
            thisOp.attributes,
            otherOp.attributes,
            priority,
          );

          if (typeof attributes?.detectionId === 'undefined') {
            if (typeof thisOp.attributes?.detectionId !== 'undefined') {
              if (
                toRemove[thisOp.attributes.detectionId] &&
                toRemove[thisOp.attributes.detectionId].this &&
                toRemove[thisOp.attributes.detectionId].other
              ) {
                // do nothing...
              } else {
                const thisEntry = {
                  start: runningCursor,
                  end: runningCursor + length,
                };
                const lastEntry =
                  attributeMarker[thisOp.attributes.detectionId];
                if (lastEntry && lastEntry.end < thisEntry.start) {
                  toRemove[thisOp.attributes.detectionId] = {
                    this: true,
                    other: true,
                  };
                  delete attributeMarker[thisOp.attributes.detectionId];
                } else {
                  attributeMarker[thisOp.attributes.detectionId] = thisEntry;
                }
              }

              if (otherOp.attributes?.detectionId) {
                const removalStatus = toRemove[
                  otherOp.attributes.detectionId
                ] || {
                  this: false,
                  other: false,
                };
                toRemove[otherOp.attributes.detectionId] = {
                  ...removalStatus,
                  other: true,
                };
                if (
                  toRemove[otherOp.attributes.detectionId] &&
                  toRemove[otherOp.attributes.detectionId].this &&
                  toRemove[otherOp.attributes.detectionId].other
                ) {
                  delete attributeMarker[otherOp.attributes.detectionId];
                }
              }

              attributes = addMetaDataAttribute(
                attributes,
                true,
                otherOp.attributes?.detectionId,
                thisOp.attributes?.detectionId,
              );
            } else {
              /// doest have a detection
            }
          } else {
            // detection from other
            if (otherOp.attributes?.detectionId) {
              if (
                toRemove[otherOp.attributes.detectionId] &&
                toRemove[otherOp.attributes.detectionId].this &&
                toRemove[otherOp.attributes.detectionId].other
              ) {
                // do nothing...
              } else {
                const thisEntry = {
                  start: runningCursor,
                  end: runningCursor + length,
                };
                const lastEntry =
                  attributeMarker[otherOp.attributes.detectionId];
                if (lastEntry && lastEntry.end < thisEntry.start) {
                  toRemove[otherOp.attributes.detectionId] = {
                    this: true,
                    other: true,
                  };
                  delete attributeMarker[otherOp.attributes.detectionId];
                } else {
                  attributeMarker[otherOp.attributes.detectionId] = thisEntry;
                }
              }
            }

            if (thisOp.attributes?.detectionId) {
              const removalStatus = toRemove[thisOp.attributes.detectionId] || {
                this: false,
                other: false,
              };
              toRemove[thisOp.attributes.detectionId] = {
                ...removalStatus,
                this: true,
              };
              if (
                toRemove[thisOp.attributes.detectionId] &&
                toRemove[thisOp.attributes.detectionId].this &&
                toRemove[thisOp.attributes.detectionId].other
              ) {
                delete attributeMarker[thisOp.attributes.detectionId];
              }
            }

            attributes = addMetaDataAttribute(
              attributes,
              false,
              thisOp.attributes?.detectionId,
            );
          }

          delta.retain(length, attributes);

          runningCursor += length;
        }
      }
    }

    const newDelta = new Delta();
    cloneDeep(delta.ops).forEach((op) => {
      let attributes = op.attributes;
      const detectionId = attributes?.detectionId || attributes?.meta?.original;

      if (detectionId) {
        if (typeof attributes?.meta === 'undefined') {
          throw Error(
            'if an attribute has a detection it should have meta info',
          );
        }
        const thisOrOther = attributes.meta.thisOrOther ? 'this' : 'other';
        const shouldDelete =
          toRemove[detectionId] && toRemove[detectionId][thisOrOther];
        if (shouldDelete) {
          const shouldNull =
            thisOrOther === 'other' &&
            typeof attributes.meta.replaces === 'string';
          if (shouldNull) {
            attributes = { ...op.attributes, detectionId: null };
          } else {
            delete attributes['detectionId'];
          }
        }
      }

      if (attributes) {
        delete attributes['meta'];
      }

      if (!attributes || Object.keys(attributes).length === 0) {
        delete op['attributes'];
        newDelta.push({ ...op });
      } else {
        newDelta.push({ ...op, attributes });
      }
    });

    return newDelta.chop();
  }

  transformPosition(index: number, priority = false): number {
    priority = !!priority;
    const thisIter = Op.iterator(this.ops);
    let offset = 0;
    while (thisIter.hasNext() && offset <= index) {
      const length = thisIter.peekLength();
      const nextType = thisIter.peekType();
      thisIter.next();
      if (nextType === 'delete') {
        index -= Math.min(length, index - offset);
        continue;
      } else if (nextType === 'insert' && (offset < index || !priority)) {
        index += length;
      }
      offset += length;
    }
    return index;
  }
}

export = Delta;
