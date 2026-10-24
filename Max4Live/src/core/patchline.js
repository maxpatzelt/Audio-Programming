/**
 * Represents a connection (patchcord) between two Max boxes.
 */
export class Patchline {
  /**
   * @param {string} sourceId - ID of source box (e.g., 'obj-1')
   * @param {number} sourceOutlet - Outlet index (0-based)
   * @param {string} destinationId - ID of destination box (e.g., 'obj-2')
   * @param {number} destinationInlet - Inlet index (0-based)
   * @param {object} [options] - Additional options like order or midpoints
   */
  constructor(sourceId, sourceOutlet, destinationId, destinationInlet, options = {}) {
    this.sourceId = sourceId;
    this.sourceOutlet = sourceOutlet;
    this.destinationId = destinationId;
    this.destinationInlet = destinationInlet;
    this.order = options.order;
    this.midpoints = options.midpoints;
  }

  toJSON() {
    const lineObj = {
      destination: [this.destinationId, this.destinationInlet],
      source: [this.sourceId, this.sourceOutlet]
    };
    if (typeof this.order === 'number') {
      lineObj.order = this.order;
    }
    if (Array.isArray(this.midpoints)) {
      lineObj.midpoints = this.midpoints;
    }
    return { patchline: lineObj };
  }
}
