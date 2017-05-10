(ns status-im.chat.views.input.box-header
  (:require [re-frame.core :refer [subscribe dispatch]]
            [status-im.components.react :refer [view
                                                touchable-highlight
                                                text
                                                icon]]
            [status-im.chat.styles.input.box-header :as style]))

(defn header [title]
  [view {:style style/header-container}
   [view style/header-title-container
    [text {:style           style/header-title-text
           :number-of-lines 1
           :font            :medium}
     title]
    [touchable-highlight {:on-press #(dispatch [:set-chat-ui-props {:result-box nil}])}
     [view style/header-close-container
      [icon :close_light_gray style/header-close-icon]]]]])