import ScriptInjector from '../core/browser/ScriptInjector';
import PackageFileReader from '../core/browser/PackageFileReader';
import Updater from '../core/browser/Updater';
import bootstrap from '../core/bootstrap';
import browser from 'browser';

function Main() {
    // constructor
    this.enableExtension = false;
}

Main.prototype = {
    run: function () {
        let self = this;

        browser.storage.local.get(null, function (items) {
            // self.enableExtension = items.enableExtension;
            self.enableExtension = true;

            self.update();
            self.bindActionButton();
            self.listenStorageChanged();
            self.listenMessage();
        });
    },

    callMessageAction: function (action, options) {
        let methodName = action + 'Action';

        if (typeof this[methodName] === 'function') {
            this[methodName].apply(this, options);
        }
    },

    bindActionButton: function () {
        browser.browserAction.onClicked.addListener(function () {
            browser.tabs.create({
                url: browser.runtime.getURL('./pages/index.html')
            });
        });
    },

    listenStorageChanged: function () {
        let self = this;

        browser.storage.onChanged.addListener(function (changes, areaName) {
            if (changes.enableExtension) {
                // self.enableExtension = changes.enableExtension.newValue;
            }
        });
    },

    listenMessage: function () {
        let self = this;

        browser.runtime.onMessage.addListener(function (message, sender, sendResponse) {
            if (message.action) {
                self.callMessageAction(message.action, [sender, sendResponse]);
            }
        });
    },

    /**
     * Message action
     */
    injectUgoiraAction: function (sender, sendResponse) {
        if (!this.enableExtension) {
            return;
        }

        var scriptInjector = new ScriptInjector();

        scriptInjector.addInjectFiles([
            'lib/jszip/jszip.js',
            'lib/gifjs/gif.js',
            'lib/whammy.js',
            // 'js/ugoira.js',
            'js/UgoiraAdapter.js',
            // 'js/180607/ugoira.js'
            'js/ugoira/ugoira190313.js'
        ]).inject(sender.tab.id);
    },

    injectMangaAction: function (sender, sendResponse) {
        var scriptInjector = new ScriptInjector();

        scriptInjector.addInjectFiles([
            "lib/jszip/jszip.js",
            "js/MangaAdapter.js",
            "js/manga/Manga186.js"
        ]).inject(sender.tab.id);
    },

    update: function () {
        PackageFileReader.read('manifest.json', function (result) {
            var manifest = JSON.parse(result);
            var version = manifest.version;

            browser.storage.local.get(null, function (items) {
                var updater = new Updater(items);

                debugger;

                if (updater.isNewer(version)) {
                    console.log('update');
                    updater.setDefaultSettings({
                        version: version,
                        enableExtend: false,
                        enableWhenUnderSeconds: 1,
                        extendDuration: 3,

                        ugoiraRenameFormat: '',
                        mangaRenameFormat: '',
                        mangaImageRenameFormat: '',

                        enableExtension: true,

                        /**
                         * @version 1.8.5
                         * Pack ugoira frames info to zip file
                         */
                        enablePackUgoiraFramesInfo: true,

                        /**
                         * @version 1.8.8
                         * Set manga page chunk
                         */
                        mangaPagesInChunk: 99
                    });

                    updater.removeSettings([
                        'metasConfig',
                        'mangaMetasConfig',
                        'mangaImageNamePrefix',
                        'mangaImagesMetasConfig'
                    ]);

                    updater.mergeSettings(function () {
                        updater.updateSetting({
                            version: version
                        }, function () {
                            // console.log('update complete. version: ' + version);
                        });
                    });
                }
            });
        });
    }
}

bootstrap(Main);
