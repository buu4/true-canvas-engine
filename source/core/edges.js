class Edges
{
  /**
   *
   * @param {number} p1
   * @param {number} p2
   * @param {object} [opts={}] Options
   * @param {object} [opts.style='#000000'] Color options for this edge
   */
  constructor(p1, p2, opts = {}) {
      this.p1 = p1;
      this.p2 = p2;
      this.opts = {
          style: '#000000',
          ...opts
      }
  }
}

module.exports = { Edges };
