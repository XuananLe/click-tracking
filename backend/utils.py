from faker.providers import DynamicProvider

device_type_provider = DynamicProvider(
     provider_name="random_device_type",
     elements=[
        "desktop","mobile", "tablet", "smartwatch", "smart_tv", "fridge", "oven", "washing_machine", "robot_vacuum", "smart_speaker"],
)

os_type_provider = DynamicProvider(
        provider_name="random_os_type", 
        elements= [
                "Windows", "macOS", "Linux", "Android", "iOS", "Chrome OS", "Ubuntu", "Fedora", "Debian", "Red Hat Enterprise Linux"
        ]
)

viewport_type_provider = DynamicProvider(
        provider_name="random_viewport_type",
        elements=[
                "1920x1080", "1366x768", "1440x900", "1280x720", "2560x1440", "3840x2160", "1024x768", "800x600", "1280x800", "1600x900"
        ]
)

browser_type_provider = DynamicProvider(
        provider_name="random_browser_type",
        elements=[
            "Chrome", "Firefox", "Safari", "Edge", "Opera", "Internet Explorer", "Brave", "Vivaldi", "Tor Browser", "Chromium"
        ]
)

connection_type_provider = DynamicProvider(
        provider_name="random_connection_type",
        elements=[
            "WiFi", "Ethernet", "Mobile Data", "Fiber Optic", "DSL", "Satellite", "Cable", "Dial-up", "5G", "4G"
        ]
)


product_type_provider = DynamicProvider(
        provider_name="random_product_type",
        elements=[
            "Electronics", "Clothing", "Home Appliances", "Books", "Toys", "Sports Equipment", "Beauty Products", "Automotive Parts", "Gardening Tools", "Pet Supplies"
        ]
)





def register_providers(fake):
    fake.add_provider(device_type_provider)
    fake.add_provider(os_type_provider)
    fake.add_provider(viewport_type_provider)
    fake.add_provider(browser_type_provider)
    fake.add_provider(connection_type_provider)
    
    return fake