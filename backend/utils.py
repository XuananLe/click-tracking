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


payment_type_provider = DynamicProvider(
        provider_name="random_payment_type",
        elements=[
            "Credit Card", "Debit Card", "PayPal", "Bank Transfer", "Cash on Delivery", "Cryptocurrency", "Gift Card", "Mobile Payment", "Buy Now Pay Later", "Direct Debit"
        ]
)


shipment_type_provider = DynamicProvider(
        provider_name="random_shipment_type",
        elements=[
            "Standard Shipping", "Express Shipping", "Overnight Shipping", "Two-Day Shipping", "Same-Day Delivery", "International Shipping", "In-Store Pickup", "Curbside Pickup", "Locker Pickup", "Drone Delivery"
        ]
)

login_type_provider = DynamicProvider(
        provider_name="random_login_type",
        elements=[
            "Email and Password", "Social Media Login", "Single Sign-On (SSO)", "Two-Factor Authentication (2FA)", "Biometric Login", "Magic Link", "OAuth", "OpenID Connect", "Passwordless Login", "Device-Based Authentication"
        ]
)

currency_type_provider = DynamicProvider(
        provider_name="random_currency_type",
        elements=[
                "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "INR", "RUB"
        ]
)


exit_reasons_type_provider = DynamicProvider(
        provider_name="random_exit_reasons_type",
        elements=[
            "Page Not Found", "Session Timeout", "User Decision", "Technical Error", "Navigation Error", "Content Not Relevant", "Payment Failure", "Security Concern", "Privacy Policy", "Other"
        ]
)



def register_providers(fake):
    fake.add_provider(device_type_provider)
    fake.add_provider(os_type_provider)
    fake.add_provider(viewport_type_provider)
    fake.add_provider(browser_type_provider)
    fake.add_provider(connection_type_provider)
    fake.add_provider(product_type_provider)
    fake.add_provider(payment_type_provider)
    fake.add_provider(shipment_type_provider)
    fake.add_provider(login_type_provider)
    fake.add_provider(currency_type_provider)
    fake.add_provider(exit_reasons_type_provider)
    
    return fake

from faker import Faker
fake = Faker()
fake = register_providers(fake)
print(fake.random_shipment_type())
print(fake.random_currency_type())
print(fake.random_exit_reasons_type())