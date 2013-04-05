describe('halocksmith', function () {
  var cleanup;

  after(function (done) {
    cleanup(done);
  });

  it('can create an exclusive lock', function (done) {
    var lock = halocksmith({ retries: 0, timeout: 2 });
    lock(function (err, release) {
      assert.ifError(err);
      cleanup = release;
      setTimeout(done, 100);
    });
    lock(function (err, release) {
      assert.ok(err instanceof Error);
      assert.equal(release, null);
    });
  });
});