package com.icon;

import androidx.annotation.ColorInt;
import androidx.annotation.NonNull;
import androidx.appcompat.widget.AppCompatImageView;

import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

public class IconViewManager extends SimpleViewManager<AppCompatImageView> {
  public static final String REACT_CLASS = "IconView";

  @Override
  @NonNull
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  @NonNull
  public AppCompatImageView createViewInstance(@NonNull ThemedReactContext reactContext) {
    return new AppCompatImageView(reactContext);
  }

  @ReactProp(name = "icon")
  public void setIcon(AppCompatImageView view, String icon) {
    int id = view.getContext().getResources().getIdentifier(icon, "drawable", view.getContext().getPackageName());
    view.setImageResource(id);
  }

  @ReactProp(name = "tint")
  public void setTint(AppCompatImageView view, @ColorInt int color) {
    view.setColorFilter(color);
  }
}
