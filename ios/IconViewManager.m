#import <React/RCTViewManager.h>


@interface IconImageView : UIImageView
@property (nonatomic, strong) UIColor *customTintColor;
@property (nonatomic, strong) NSString *iconName;
@end

@implementation IconImageView

static NSBundle *iconBundle;

+(NSBundle *)getResourcesBundle {
    if (iconBundle) return iconBundle;
    iconBundle = [NSBundle bundleWithURL:[[NSBundle bundleForClass:[self class]] URLForResource:@"IconAssets" withExtension:@"bundle"]];
    return iconBundle;
}

-(void)setIconImage {
    NSBundle *bundle = [IconImageView getResourcesBundle];
    if (self.customTintColor) {
        self.image = [[UIImage imageNamed:self.iconName inBundle:bundle withConfiguration:nil] imageWithRenderingMode:UIImageRenderingModeAlwaysTemplate];
    } else {
        self.image = [UIImage imageNamed:self.iconName inBundle:bundle withConfiguration:nil];
    }
    self.contentMode = UIViewContentModeScaleAspectFit;
}

-(void)applyTint {
    self.tintColor = self.customTintColor;
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps {
    
    if ([changedProps containsObject:@"icon"] && ![changedProps containsObject:@"tint"]) {
        [self setIconImage];
    }
    
    if ([changedProps containsObject:@"tint"]) {
        [self setIconImage];
        [self applyTint];
    }
    
    
}
@end


@interface IconViewManager : RCTViewManager

@end

@implementation IconViewManager

RCT_EXPORT_MODULE(IconView)

- (UIImageView *)view {
  return [[IconImageView alloc] init];
}

RCT_CUSTOM_VIEW_PROPERTY(icon, NSString, IconImageView) {
    view.iconName = json;
}

RCT_CUSTOM_VIEW_PROPERTY(tint, NSNumber, IconImageView) {
    view.customTintColor = [RCTConvert UIColor:json];
}

@end
