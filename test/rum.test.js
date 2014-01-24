'use strict';

var path   = require('path')
  , chai   = require('chai')
  , assert = require('assert')
  , helper = require(path.join(__dirname, 'lib', 'agent_helper.js'))
  , API    = require(path.join(__dirname, '..', 'api.js'))
  ;

chai.should();

describe("the RUM API", function () {
  var agent
    , api
    ;

  beforeEach(function () {
    agent = helper.loadMockedAgent();
    agent.config.browser_monitoring.enable = true;
    agent.config.browser_monitoring.debug = false;
    api = new API(agent);
  });

  afterEach(function () {
    helper.unloadAgent(agent);
  });

  it('should not generate header when disabled', function () {
    agent.config.browser_monitoring.enable = false;
    api.makeBrowserMonitoringHeader()
      .should.equal('<!-- why is the rum gone? (0) -->');
  });

  it('should issue a warning outside a transaction', function () {
    api.makeBrowserMonitoringHeader()
      .should.equal('<!-- why is the rum gone? (1) -->');
  });

  it('should issue a warning if transaction has no name', function () {
    helper.runInTransaction(agent, function () {
      api.makeBrowserMonitoringHeader()
        .should.equal('<!-- why is the rum gone? (3) -->');
    });
  });

  it('should issue a warning without an application_id', function () {
    helper.runInTransaction(agent, function (t) {
      t.setName('hello');
      api.makeBrowserMonitoringHeader()
        .should.equal('<!-- why is the rum gone? (4) -->');
    });
  });

  it('should return the rum headers when in a named transaction', function () {
    helper.runInTransaction(agent, function (t) {
      t.setName('hello');
      agent.config.application_id = 12345;
      api.makeBrowserMonitoringHeader()
        .indexOf('<script').should.equal(0);
    });
  });

  it('should return pretty print when debugging', function () {
    agent.config.browser_monitoring.debug = true;
    helper.runInTransaction(agent, function (t) {
      t.setName('hello');
      agent.config.application_id = 12345;
      var l = api.makeBrowserMonitoringHeader().split('\n').length;

      // there should be about 5 new lines here, this is a really *rough*
      // estimate if it's being pretty printed
      assert(l > 5);
    });
  });

  it('should be compact when not debugging', function () {
    helper.runInTransaction(agent, function (t) {
      t.setName('hello');
      agent.config.application_id = 12345;
      var l = api.makeBrowserMonitoringHeader().split('\n').length;
      assert.equal(l, 1);
    });
  });

});
