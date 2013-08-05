// Generated by CoffeeScript 1.6.3
define(['jquery', 'underscore', 'backbone', 'router', 'models/ConfigModel', 'models/AtAGlanceModel', 'views/SidebarView', 'views/ContentView', 'views/HITView', 'models/HITModel', 'collections/HITCollection', 'text!templates/overview.html', 'text!templates/sidebar.html', 'views/RunExptView', 'views/PayAndBonusView', 'collections/WorkerCollection'], function($, _, Backbone, Router, ConfigModel, AtAGlanceModel, SidebarView, ContentView, HITView, HIT, HITs, OverviewTemplate, SideBarTemplate, RunExptView, PayAndBonusView, Workers) {
  return {
    events: {
      'click a': 'pushstateClick',
      'click li': 'pushstateClick'
    },
    pushstateClick: function(event) {
      return event.preventDefault();
    },
    asked_for_credentials: false,
    getCredentials: function() {
      var _this = this;
      if (!this.asked_for_credentials) {
        $('#aws-info-modal').modal('show');
        this.asked_for_credentials = true;
        return $('.save').click(function(event) {
          event.preventDefault();
          _this.save(event);
          return $('#aws-info-modal').modal('hide');
        });
      }
    },
    save: function(event) {
      var configData, inputData, section,
        _this = this;
      event.preventDefault();
      section = $(event.target).data('section');
      inputData = {};
      configData = {};
      $.each($('#myform').serializeArray(), function(i, field) {
        return inputData[field.name] = field.value;
      });
      configData[section] = inputData;
      this.config.save(configData);
      $('li').removeClass('selected');
      $('#overview').addClass('selected');
      return $.when(this.config.fetch(), this.ataglance.fetch().then(function() {
        var hit_view, overview;
        overview = _.template(OverviewTemplate, {
          input: {
            balance: _this.ataglance.get("balance"),
            debug: _this.config.get("Server Parameters").debug === "True" ? "checked" : "",
            using_sandbox: _this.config.get("HIT Configuration").using_sandbox === "True" ? "checked" : ""
          }
        });
        $('#content').html(overview);
        hit_view = new HITView({
          collection: new HITs
        });
        $("#tables").html(hit_view.render().el);
        $('input#debug').on("click", function() {
          return _this.saveDebugState();
        });
        $('li').removeClass('selected');
        $('#overview').addClass('selected');
        return _this.pubsub.trigger("captureUIEvents");
      }));
    },
    pushstateClick: function(event) {
      return event.preventDefault();
    },
    verifyAWSLogin: function() {
      var configPromise,
        _this = this;
      configPromise = this.config.fetch();
      return configPromise.done(function() {
        var inputData, key_id, secret_key;
        key_id = _this.config.get("AWS Access").aws_access_key_id;
        secret_key = _this.config.get("AWS Access").aws_secret_access_key;
        inputData = {};
        inputData["aws_access_key_id"] = key_id;
        inputData["aws_secret_access_key"] = secret_key;
        return $.ajax({
          url: "/verify_aws_login",
          type: "POST",
          dataType: "json",
          contentType: "application/json; charset=utf-8",
          data: JSON.stringify(inputData),
          success: function(response) {
            if (response.aws_accnt === 0) {
              _this.getCredentials();
              return $('#aws-indicator').css("color", "red").attr("class", "icon-lock");
            } else {
              return $('#aws-indicator').css("color", "white").attr("class", "icon-unlock");
            }
          },
          error: function() {
            return console.log("aws verification failed");
          }
        });
      });
    },
    serverParamsSave: function() {
      var configResetPromise;
      this.save();
      configResetPromise = this.config.fetch();
      return configResetPromise.done(function() {
        var domain, url, url_pattern;
        url = this.config.get("HIT Configuration").question_url + '/shutdown';
        url_pattern = /^https?\:\/\/([^\/:?#]+)(?:[\/:?#]|$)/i;
        domain = url.match(url_pattern)[0] + this.config.get("Server Parameters").port + '/shutdown';
        return $.ajax({
          url: domain,
          type: "GET",
          data: {
            hash: this.config.get("Server Parameters").hash
          }
        });
      });
    },
    saveDebugState: function() {
      var debug;
      debug = $("input#debug").is(':checked');
      return this.config.save({
        "Server Parameters": {
          debug: debug
        }
      });
    },
    saveSandboxState: function() {
      var callback, isCallback, state,
        _this = this;
      isCallback = false;
      state = arguments[0];
      if (arguments.length > 0) {
        callback = arguments[1];
        isCallback = true;
      }
      return this.config.save({
        "HIT Configuration": {
          using_sandbox: state
        }
      }, {
        complete: function() {
          if (isCallback) {
            return callback();
          }
        }
      }, {
        error: function(error) {
          return console.log("error");
        }
      });
    },
    getExperimentStatus: function() {
      return $.ajax({
        url: '/get_hits',
        type: "GET",
        success: function(data) {
          if (data.hits.length > 0) {
            return $('#experiment_status').css({
              "color": "green"
            });
          } else {
            return $('#experiment_status').css({
              "color": "grey"
            });
          }
        }
      });
    },
    isInternetAvailable: function() {
      return $.ajax({
        url: '/is_internet_available',
        type: "GET",
        success: function(data) {
          console.log(data === "false");
          if (data === "true") {
            return 1.;
          } else {
            return 0.;
          }
        },
        error: console.log("network failure")
      });
    },
    launchPsiTurkServer: function() {
      $('#server_status').css({
        "color": "yellow"
      });
      $('#server_controls').html("[<a href='#'>updating...</a>]");
      return $.ajax({
        url: '/launch',
        type: "GET"
      });
    },
    stopPsiTurkServer: function() {
      $('#server-off-modal').modal('show');
      return $('#shutdownServerBtn').on("click", function() {
        $('#server_status').css({
          "color": "yellow"
        });
        $('#server_controls').html("[<a href='#'>updating...</a>]");
        return $.ajax({
          url: '/shutdown_psiturk',
          type: "GET",
          success: $('#server-off-modal').modal('hide')
        });
      });
    },
    loadHITTable: function() {
      var hit_view;
      hit_view = new HITView({
        collection: new HITs
      });
      return $("#tables").html(hit_view.render().el);
    },
    loadPayView: function() {
      var configPromise, reloadPayView,
        _this = this;
      reloadPayView = _.bind(this.loadPayView, this);
      configPromise = this.config.fetch();
      return configPromise.done(function() {
        var pay_and_bonus_view;
        if (_this.config.get("HIT Configuration").using_sandbox === "True") {
          $('#pay-sandbox-on').addClass('active');
          $('#pay-sandbox-off').removeClass('active');
        } else {
          $('#pay-sandbox-on').removeClass('active');
          $('#pay-sandbox-off').addClass('active');
        }
        pay_and_bonus_view = new PayAndBonusView({
          collection: new Workers
        });
        $("#pay-table").html(pay_and_bonus_view.render().el);
        $(document).on("click", '.approve', function() {
          var assignmentId,
            _this = this;
          assignmentId = $(this).attr("id");
          return $.ajax({
            contentType: "application/json; charset=utf-8",
            url: '/approve_worker',
            type: "POST",
            dataType: 'json',
            data: JSON.stringify({
              assignmentId: assignmentId
            }),
            complete: function() {
              return reloadPayView();
            },
            error: function(error) {
              return console.log(error);
            }
          });
        });
        return $(document).on("click", '.reject', function() {
          var assignmentId,
            _this = this;
          assignmentId = $(this).attr("id");
          return $.ajax({
            contentType: "application/json; charset=utf-8",
            url: '/reject_worker',
            type: "POST",
            dataType: 'json',
            data: JSON.stringify({
              assignmentId: assignmentId
            }),
            complete: function() {
              return reloadPayView();
            },
            error: function(error) {
              return console.log(error);
            }
          });
        });
      });
    },
    monitorPsiturkServer: function() {
      var pollResults, pollStream, pollingServer,
        _this = this;
      pollStream = $('body').asEventStream('check_status');
      pollResults = pollStream.flatMap(function() {
        return Bacon.fromPromise($.ajax("/server_status"));
      });
      pollResults.onValue(function(data) {
        var UP, server, statusChanged;
        UP = 0;
        server = parseInt(data.state);
        statusChanged = !(_this.server_status === server);
        if (server === UP && statusChanged) {
          _this.server_status = server;
          $('#server_status').css({
            "color": "green"
          });
          $('#server_controls').html("[<a href='#' id='server_off'>turn off?</a>]");
          return _this.captureUIEvents();
        } else if (statusChanged) {
          _this.server_status = server;
          $('#server_status').css({
            "color": "red"
          });
          $('#server_controls').html("[<a href='#' id='server_on'>turn on?</a>]");
          return _this.captureUIEvents();
        }
      });
      pollingServer = function() {
        return Bacon.fromPoll(1500, function() {
          return $('body').trigger('check_status');
        });
      };
      return pollingServer().onValue();
    },
    loadContent: function() {
      var contentView, launchWithInternet, launchWithoutInternet, recaptureUIEvents, saveDebugState,
        _this = this;
      this.config = new ConfigModel;
      this.ataglance = new AtAGlanceModel;
      recaptureUIEvents = function() {
        return _this.pubsub.trigger("captureUIEvents");
      };
      saveDebugState = _.bind(this.saveDebugState, this);
      launchWithoutInternet = function() {
        var overview, sideBarHTML, sidebarView;
        overview = _.template(OverviewTemplate, {
          input: {
            balance: "-",
            debug: _this.config.get("Server Parameters").debug === "True" ? "checked" : ""
          }
        });
        $('#content').html(overview);
        sidebarView = new SidebarView({
          config: _this.config,
          pubsub: _this.pubsub
        });
        sideBarHTML = _.template(SideBarTemplate);
        $('#sidebar').html(sideBarHTML);
        sidebarView.initialize();
        if (_this.config.get("HIT Configuration").using_sandbox === "True") {
          $('#sandbox-on').addClass('active');
          $('#sandbox-off').removeClass('active');
        } else {
          $('#sandbox-on').removeClass('active');
          $('#sandbox-off').addClass('active');
        }
        return _this.captureUIEvents();
      };
      launchWithInternet = function() {
        return _this.ataglance.fetch().pipe(function() {
          return _this.config.fetch().done(function() {
            var overview, sideBarHTML, sidebarView;
            overview = _.template(OverviewTemplate, {
              input: {
                balance: _this.ataglance.get("balance"),
                debug: _this.config.get("Server Parameters").debug === "True" ? "checked" : ""
              }
            });
            $('#content').html(overview);
            sidebarView = new SidebarView({
              config: _this.config,
              ataglance: _this.ataglance,
              pubsub: _this.pubsub
            });
            sideBarHTML = _.template(SideBarTemplate);
            $('#sidebar').html(sideBarHTML);
            sidebarView.initialize();
            if (_this.config.get("HIT Configuration").using_sandbox === "True") {
              $('#sandbox-on').addClass('active');
              $('#sandbox-off').removeClass('active');
            } else {
              $('#sandbox-on').removeClass('active');
              $('#sandbox-off').addClass('active');
            }
            _this.loadHITTable();
            _this.captureUIEvents();
            _this.verifyAWSLogin();
            return _this.getExperimentStatus();
          });
        });
      };
      $.ajax({
        url: '/is_internet_available',
        type: "GET",
        success: function(data) {
          var internetIsOn;
          internetIsOn = data === "true";
          if (internetIsOn) {
            return launchWithInternet();
          } else {
            return launchWithoutInternet();
          }
        }
      });
      contentView = new ContentView();
      return contentView.initialize();
    },
    loadPayTable: function() {
      var pay_and_bonus_view;
      pay_and_bonus_view = new PayAndBonusView({
        collection: new Workers
      });
      return $("#pay-table").html(pay_and_bonus_view.render().el);
    },
    captureUIEvents: function() {
      var reloadContent, renderTestBtn,
        _this = this;
      $('.dropdown-toggle').dropdown();
      $('#sandbox-on').off('click').on('click', function() {
        return _this.saveSandboxState(true, _this.loadContent);
      });
      $('#sandbox-off').off('click').on('click', function() {
        return _this.saveSandboxState(false, _this.loadContent);
      });
      $('#pay-sandbox-on').off('click').on('click', function() {
        return _this.saveSandboxState(true, _this.loadPayView);
      });
      $('#pay-sandbox-off').off('click').on('click', function() {
        return _this.saveSandboxState(false, _this.loadPayView);
      });
      $('#test').off('click').on('click', function() {
        var uniqueId;
        uniqueId = new Date().getTime();
        return window.open(_this.config.get("HIT Configuration").question_url + "?assignmentId=debug" + uniqueId + "&hitId=debug" + uniqueId + "&workerId=debug" + uniqueId);
      });
      $("#server_off").off('click').on("click", function() {
        return _this.stopPsiTurkServer();
      });
      $("#server_on").off("click").on("click", function() {
        return _this.launchPsiTurkServer();
      });
      $('.restart').off("click").on("click", function(event) {
        return _this.save(event);
      });
      $('#run').on("click", function() {
        var runExptView;
        runExptView = new RunExptView({
          config: _this.config
        });
        $('#run-expt-modal').modal('show');
        $('.run-expt').on("keyup", function(event) {
          var TURK_FEE_RATE, configData, inputData;
          inputData = {};
          configData = {};
          $.each($('#expt-form').serializeArray(), function(i, field) {
            return inputData[field.name] = field.value;
          });
          TURK_FEE_RATE = 0.10;
          $('#total').html((inputData["reward"] * inputData["max_assignments"] * (1 + TURK_FEE_RATE)).toFixed(2));
          $('#fee').val((inputData["reward"] * inputData["max_assignments"] * TURK_FEE_RATE).toFixed(2));
          configData["HIT Configuration"] = inputData;
          return _this.config.save(configData);
        });
        return $('#run-expt-btn').off('click').on("click", function() {
          return $.ajax({
            contentType: "application/json; charset=utf-8",
            url: '/mturk_services',
            type: "POST",
            dataType: 'json',
            data: JSON.stringify({
              mturk_request: "create_hit"
            }),
            complete: function() {
              var hit_view;
              $('#run-expt-modal').modal('hide');
              hit_view = new HITView({
                collection: new HITs
              });
              $("#tables").html(hit_view.render().el);
              return _this.pubsub.trigger("getExperimentStatus");
            },
            error: function(error) {
              console.log(error);
              return $('#expire-modal').modal('hide');
            }
          });
        });
      });
      $('#shutdown-dashboard').off("click").on('click', function() {
        $('#dashboard-off-modal').modal('show');
        return $.ajax({
          url: '/shutdown_dashboard',
          type: "GET",
          success: function() {}
        });
      });
      $(document).off("click").on("click", '.save', function() {
        event.preventDefault();
        _this.options.pubsub.trigger("save", event);
        return $(document).off("click").on("click", '.save_data', function(event) {
          event.preventDefault();
          return _this.options.pubsub.trigger("save", event);
        });
      });
      $('input#debug').off('click').on("click", function() {
        return _this.saveDebugState();
      });
      $(document).off("click").on("click", '#aws-info-save', function() {
        return _this.verifyAWSLogin();
      });
      $(document).off('click').on("click", '#server-parms-save', function() {
        return _this.serverParamsSave();
      });
      reloadContent = this.loadContent;
      $(document).off('click').on("click", '.expire', function() {
        var hitid;
        hitid = $(this).attr('id');
        $('#expire-modal').modal('show');
        return $('#expire-btn').on('click', function() {
          var data,
            _this = this;
          data = JSON.stringify({
            mturk_request: "expire_hit",
            hitid: hitid
          });
          return $.ajax({
            contentType: "application/json; charset=utf-8",
            url: '/mturk_services',
            type: "POST",
            dataType: 'json',
            data: data,
            complete: function() {
              $('#expire-modal').modal('hide');
              return reloadContent();
            },
            error: function(error) {
              return console.log("failed to expire HIT");
            }
          });
        });
      });
      $(document).on("click", '.extend', function() {
        var hitid;
        hitid = $(this).attr('id');
        $('#extend-modal').modal('show');
        return $('#extend-btn').on('click', function() {
          var data;
          data = JSON.stringify({
            mturk_request: "extend_hit",
            hitid: hitid,
            assignments_increment: $('#extend-workers').val(),
            expiration_increment: $('#extend-time').val()
          });
          return $.ajax({
            contentType: "application/json; charset=utf-8",
            url: '/mturk_services',
            type: "POST",
            dataType: 'json',
            data: data,
            complete: function() {
              $('#extend-modal').modal('hide');
              return reloadContent();
            },
            error: function(error) {
              return console.log("failed to extend HIT");
            }
          });
        });
      });
      return (renderTestBtn = function() {
        var UP;
        UP = 0;
        return $.ajax({
          url: "/server_status",
          success: function(data) {
            var server;
            server = parseInt(data.state);
            if (server === UP) {
              return $('#test').show();
            } else {
              return $('#test').hide();
            }
          }
        });
      })();
    },
    initialize: function() {
      Router.initialize();
      this.pubsub = _.extend({}, Backbone.Events);
      _.bindAll(this, "getExperimentStatus");
      _.bindAll(this, "captureUIEvents");
      _.bindAll(this, "loadContent");
      _.bindAll(this, "save");
      _.bindAll(this, "loadPayView");
      this.pubsub.bind("getExperimentStatus", this.getExperimentStatus);
      this.pubsub.bind("captureUIEvents", this.captureUIEvents);
      this.pubsub.bind("loadContent", this.loadContent);
      this.pubsub.bind("loadPayTable", this.loadPayTable);
      this.pubsub.bind("loadPayView", this.loadPayView);
      this.pubsub.bind("save", this.save);
      this.loadContent();
      return this.monitorPsiturkServer();
    }
  };
});
