#import <React/RCTViewManager.h>

@interface IconViewManager : RCTViewManager

@end

@implementation IconViewManager

RCT_EXPORT_MODULE(IconView)

- (UIImageView *)view {
  return [[UIImageView alloc] init];
}

static NSBundle *iconBundle;

+(NSBundle *)getResourcesBundle {
    if (iconBundle) return iconBundle;
    iconBundle = [NSBundle bundleWithURL:[[NSBundle bundleForClass:[self class]] URLForResource:@"IconAssets" withExtension:@"bundle"]];
    return iconBundle;
}

RCT_CUSTOM_VIEW_PROPERTY(icon, NSString, UIImageView) {
    NSLog(@"--- %@", json);
    NSBundle *bundle = [IconViewManager getResourcesBundle];
    view.image = [UIImage imageNamed:@"Icon_check" inBundle:bundle withConfiguration:nil];
  //[view setBackgroundColor:[self hexStringToColor:json]];
}

@end
